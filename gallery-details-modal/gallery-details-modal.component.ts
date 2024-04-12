import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CORE_DIALOG_DATA, CoreDialogRef } from '@lk/core-ui-kit/lib/dialog';
import { IDetailsModalData } from '../gallery.interface';

@Component({
  selector: 'core-gallery-details-modal',
  templateUrl: './gallery-details-modal.component.html',
  styleUrls: ['./gallery-details-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryDetailsModalComponent {
  constructor(
    private dialogRef: CoreDialogRef<GalleryDetailsModalComponent>,
    @Inject(CORE_DIALOG_DATA) public data: IDetailsModalData,
  ) {}

  public close(): void {
    this.dialogRef.close();
  }
}
