import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IGalleryFile } from '../gallery.interface';
import { GalleryService } from '../gallery.service';

@Component({
  selector: 'core-gallery-selectable-file',
  templateUrl: './gallery-selectable-file.component.html',
  styleUrls: ['./gallery-selectable-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GallerySelectableFileComponent {
  @Input() public file: IGalleryFile | undefined;
  @Input() public isSelected = false;
  @Output() public changeSelect = new EventEmitter();

  public get previewSrc(): string {
    return this.file ? this.galleryService.getPreviewSrc(this.file) : '';
  }

  constructor(private galleryService: GalleryService) {}

  public onChangeSelect(): void {
    this.changeSelect.emit();
  }
}
