import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { isTouchDevice } from '@lk/core-ui-kit/lib/utils';
import { getFilesize, isPdf } from '@lk/core-ui-kit/lib/utils';
import { IGalleryFile } from '../gallery.interface';
import { GalleryService } from '../gallery.service';
import { EVENTS_ERRORS, ZOOM_ACTIONS_ENUM, ZOOM_STATE } from '../gallery.enums';
import { catchError } from 'rxjs/operators';
import { CoreSnackBar } from '@lk/core-ui-kit/lib/snack-bar';

@Component({
  selector: 'core-gallery-details',
  templateUrl: './gallery-details.component.html',
  styleUrls: ['./gallery-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryDetailsComponent {
  @Input() public files$: BehaviorSubject<IGalleryFile[]>;
  @Input() public currentFileIndex = 0;
  @Input() public deleteFile: ((file: IGalleryFile) => Observable<void>) | undefined;
  @Output() public allFilesDeleted = new EventEmitter();

  public zoom$ = new BehaviorSubject(ZOOM_ACTIONS_ENUM.ZOOM_CLEAR);
  public isMinZoom = true;

  public isTouchDevice = isTouchDevice();

  public get currentFile(): IGalleryFile {
    return this.files$.value[this.currentFileIndex];
  }

  public get filesCount(): number {
    return this.files$.value.length;
  }

  public get showPrevButton(): boolean {
    return this.currentFileIndex !== 0;
  }

  public get showNextButton(): boolean {
    return this.currentFileIndex !== this.filesCount - 1;
  }

  public get fileSrc(): string {
    return this.currentFile ? this.galleryService.getPreviewSrc(this.currentFile, 2) : '';
  }

  public get fileSize(): string {
    return this.currentFile ? getFilesize(this.currentFile.fileSize, 1) : '';
  }

  public get isPdf(): boolean {
    return !!this.currentFile && isPdf(this.currentFile.mimeType);
  }

  constructor(
    private galleryService: GalleryService,
    private cdr: ChangeDetectorRef,
    private snackBar: CoreSnackBar,
  ) {}

  public zoomChanged(state: ZOOM_STATE): void {
    this.isMinZoom = state === ZOOM_STATE.ZOOM_IN;
  }

  public changeZoom(): void {
    this.zoom$.next(this.isMinZoom ? ZOOM_ACTIONS_ENUM.ZOOM_MAX : ZOOM_ACTIONS_ENUM.ZOOM_CLEAR);
  }

  public openPdf(file: IGalleryFile): void {
    const url = this.galleryService.getDownloadLink(file);
    this.galleryService
      .getFileBlob(url)
      .pipe(
        catchError(error => {
          this.errorMessage(EVENTS_ERRORS.OPEN_PDF);
          return throwError(error);
        }),
      )
      .subscribe(data => {
        this.galleryService.openBlob(data);
      });
  }

  public downloadFile(file: IGalleryFile): void {
    const url = this.galleryService.getDownloadLink(file);
    this.galleryService
      .getFileBlob(url)
      .pipe(
        catchError(error => {
          this.errorMessage(EVENTS_ERRORS.DOWNLOAD);
          return throwError(error);
        }),
      )
      .subscribe(data => {
        this.galleryService.downloadBlob(data, file.fileName);
      });
  }

  public delete(): void {
    if (this.deleteFile) {
      this.deleteFile(this.currentFile).subscribe(() => {
        if (this.files$.value?.length) {
          this.currentFileIndex = Math.min(this.currentFileIndex, this.filesCount - 1);
          this.cdr.detectChanges();
        } else {
          this.allFilesDeleted.emit();
        }
      });
    }
  }

  private errorMessage(message: string): void {
    this.snackBar.open(message, null, {
      panelClass: 'warning',
    });
  }

  public changeFile(changeDirection: -1 | 1): void {
    this.zoom$.next(ZOOM_ACTIONS_ENUM.ZOOM_CLEAR);
    if (changeDirection === -1) {
      this.currentFileIndex = this.currentFileIndex === 0 ? this.filesCount - 1 : this.currentFileIndex - 1;
    }
    if (changeDirection === 1) {
      this.currentFileIndex = this.currentFileIndex === this.filesCount - 1 ? 0 : this.currentFileIndex + 1;
    }
  }
}
