import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CORE_DIALOG_DATA, CoreDialogRef } from '@lk/core-ui-kit/lib/dialog';
import { IFileRemoveModalData, IGalleryFile, ISelectableFile } from '../gallery.interface';
import { GalleryService } from '../gallery.service';

@Component({
  selector: 'core-gallery-remove-modal',
  templateUrl: './gallery-remove-modal.component.html',
  styleUrls: ['./gallery-remove-modal.component.scss', '../gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryRemoveModalComponent implements OnInit, OnDestroy {
  public groupedFiles: Map<number, (IGalleryFile & ISelectableFile)[]> = new Map();
  public selectedFiles: IGalleryFile[] = [];

  public get selectedFilesSize(): number {
    return GalleryService.getFilesTotalSize(this.selectedFiles);
  }

  public get groupKeys(): number[] {
    return Array.from(this.groupedFiles.keys()).sort((a, b) => b - a);
  }

  constructor(
    private dialogRef: CoreDialogRef<GalleryRemoveModalComponent>,
    @Inject(CORE_DIALOG_DATA) public data: IFileRemoveModalData,
  ) {}

  public ngOnInit(): void {
    this.groupFiles();
  }

  private groupFiles(): void {
    this.data.files.forEach((file: IGalleryFile) => {
      const day = new Date(file.created).getTime();
      if (this.groupedFiles.get(day)) {
        (this.groupedFiles.get(day) || []).push(file);
      } else {
        this.groupedFiles.set(day, [file]);
      }
    });
  }

  public trackByMnemonic(_: number, file: IGalleryFile & ISelectableFile): string {
    return file.mnemonic;
  }

  public changeSelect(file: IGalleryFile & ISelectableFile): void {
    file.selected = !file.selected;
    this.selectedFiles = file.selected
      ? this.selectedFiles.concat(file)
      : this.selectedFiles.filter(f => file.mnemonic !== f.mnemonic);
  }

  public cancelSelect(): void {
    this.selectedFiles = [];
    this.data.files.forEach((file: IGalleryFile & ISelectableFile) => (file.selected = false));
  }

  public deleteAllFiles(): void {
    if (this.data.deleteAllFiles) {
      this.close();
      this.data.deleteAllFiles();
    }
  }

  public deleteSelectedFiles(): void {
    if (this.data.deleteSelectedFiles) {
      this.close();
      this.data.deleteSelectedFiles(this.selectedFiles);
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  public ngOnDestroy(): void {
    this.cancelSelect();
  }
}
