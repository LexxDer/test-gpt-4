import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, throwError } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { CoreDialog, CoreDialogConfig } from '@lk/core-ui-kit/lib/dialog';
import { IFreeSpaceErrorModalData, IGalleryConfig, IGalleryFile } from './gallery.interface';
import { GalleryService } from './gallery.service';
import { GalleryFreeSpaceErrorModalComponent } from './gallery-free-space-error-modal/gallery-free-space-error-modal.component';
import { GalleryRemoveModalComponent } from './gallery-remove-modal/gallery-remove-modal.component';
import { GalleryDetailsModalComponent } from './gallery-details-modal/gallery-details-modal.component';
import { EVENTS_ERRORS } from './gallery.enums';
import { OnDestroyClass } from '@lk/core-ui-kit/lib/core';
import { CoreSnackBar } from '@lk/core-ui-kit/lib/snack-bar';

@Component({
  selector: 'core-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent extends OnDestroyClass implements OnInit {
  @Input() public modalsTitle = '';
  @Input() public config!: IGalleryConfig;
  @Input() public files$!: BehaviorSubject<IGalleryFile[]>;
  @Input() public callFreeSpaceError$: Subject<Pick<IFreeSpaceErrorModalData, 'currentFilesSize' | 'maxFilesSize'>>;
  @Input() public downloadArchive: () => Observable<{ blob: Blob; fileName: string }>;
  @Input() public deleteFile: (file: IGalleryFile) => Observable<void>;
  @Input() public deleteSelectedFiles: (file: IGalleryFile[]) => Observable<void[]>;
  @Input() public deleteAllFiles: () => Observable<void>;
  @Output() public updateFiles: EventEmitter<void> = new EventEmitter<void>();

  public downloading = false;
  public downloadingSubscription: Subscription | undefined;

  public get totalFilesSize(): number {
    return GalleryService.getFilesTotalSize(this.files$.value);
  }

  constructor(
    private galleryService: GalleryService,
    private cdr: ChangeDetectorRef,
    private dialog: CoreDialog,
    private snackBar: CoreSnackBar,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initConfig();
    this.addEventListeners();
  }

  private initConfig(): void {
    this.galleryService.setConfig(this.config);
  }

  private addEventListeners(): void {
    if (this.callFreeSpaceError$) {
      this.callFreeSpaceError$.pipe(takeUntil(this._onDestroy$)).subscribe(({ currentFilesSize, maxFilesSize }) => {
        this.showFreeSpaceErrorModal(currentFilesSize, maxFilesSize);
      });
    }
  }

  public showRemoveFilesModal = (currentFilesSize: number, maxFilesSize: number, title: string): void => {
    const dialogConfig = new CoreDialogConfig();
    dialogConfig.id = 'selectAndRemove';
    dialogConfig.data = {
      currentFilesSize,
      maxFilesSize,
      title,
      files: this.files$.value,
      deleteAllFiles: this.onDeleteAllFiles,
      deleteSelectedFiles: this.onDeleteSelectedFiles,
    };
    dialogConfig.autoFocus = 'dialog';
    this.dialog.open(GalleryRemoveModalComponent, dialogConfig);
  };

  public showFreeSpaceErrorModal = (currentFilesSize: number, maxFilesSize: number): void => {
    const dialogConfig = new CoreDialogConfig();
    dialogConfig.data = {
      currentFilesSize,
      maxFilesSize,
      title: this.modalsTitle,
      apply: this.showRemoveFilesModal,
    };
    dialogConfig.autoFocus = 'dialog';
    this.dialog.open(GalleryFreeSpaceErrorModalComponent, dialogConfig);
  };

  public showDetailsModal = (index: number): void => {
    const dialogConfig = new CoreDialogConfig();
    dialogConfig.data = {
      title: this.modalsTitle,
      files$: this.files$,
      index,
      delete: this.onDeleteFile,
    };
    dialogConfig.id = 'galleryDetails';
    dialogConfig.autoFocus = 'dialog';
    this.dialog.open(GalleryDetailsModalComponent, dialogConfig);
  };

  public onDownloadArchive(): void {
    this.downloading = true;
    this.downloadingSubscription = this.downloadArchive()
      .pipe(
        takeUntil(this._onDestroy$),
        catchError(error => {
          this.errorMessage(EVENTS_ERRORS.DOWNLOAD);
          return throwError(error);
        }),
        finalize(() => {
          this.downloading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(({ blob, fileName }) => {
        this.galleryService.downloadBlob(blob, fileName);
      });
  }

  public cancelDownloadArchive(): void {
    this.downloadingSubscription?.unsubscribe();
    this.downloading = false;
  }

  private errorMessage = (message: string): void => {
    this.snackBar.open(message, null, {
      panelClass: 'warning',
    });
  };

  public onDeleteFile = (file: IGalleryFile): Observable<void> => {
    return this.deleteFile(file).pipe(
      takeUntil(this._onDestroy$),
      catchError(error => {
        this.errorMessage(EVENTS_ERRORS.DELETE);
        return throwError(error);
      }),
    );
  };

  public onDeleteAllFiles = (): void => {
    this.deleteAllFiles()
      .pipe(
        takeUntil(this._onDestroy$),
        catchError(error => {
          this.errorMessage(EVENTS_ERRORS.DELETE);
          return throwError(error);
        }),
      )
      .subscribe();
  };

  public onDeleteSelectedFiles = (files: IGalleryFile[]): void => {
    this.deleteSelectedFiles(files)
      .pipe(
        takeUntil(this._onDestroy$),
        catchError(error => {
          this.errorMessage(EVENTS_ERRORS.DELETE);
          return throwError(error);
        }),
      )
      .subscribe();
  };
}
