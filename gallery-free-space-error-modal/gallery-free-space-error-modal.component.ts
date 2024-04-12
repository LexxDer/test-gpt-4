import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CORE_DIALOG_DATA, CoreDialogRef } from '@lk/core-ui-kit/lib/dialog';
import { IFreeSpaceErrorModalData } from '../gallery.interface';

@Component({
  selector: 'core-gallery-free-space-error-modal',
  templateUrl: './gallery-free-space-error-modal.component.html',
  styleUrls: ['./gallery-free-space-error-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryFreeSpaceErrorModalComponent {
  constructor(
    private dialogRef: CoreDialogRef<GalleryFreeSpaceErrorModalComponent>,
    @Inject(CORE_DIALOG_DATA) public data: IFreeSpaceErrorModalData,
  ) {}

  public close(): void {
    this.dialogRef.close();
  }

  public apply(): void {
    this.close();
    this.data.apply(this.data.currentFilesSize, this.data.maxFilesSize, this.data.title);
  }
}
