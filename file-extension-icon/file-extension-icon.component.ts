import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'core-file-extension-icon',
  templateUrl: './file-extension-icon.component.html',
  styleUrls: ['./file-extension-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExtensionIconComponent implements OnInit {
  @Input() public fileExt: string;
  @Input() public mimeType: string;

  private shortExtMap: { [key: string]: string } = {
    DOCX: 'DOC',
    PPTX: 'PPT',
    XLSX: 'XLS',
    TIFF: 'TIF',
    JPEG: 'JPG',
  };

  public ngOnInit(): void {
    if (!this.fileExt && this.mimeType) {
      this.fileExt = this.getFileExtFromMimeType(this.mimeType);
    }
    if (this.fileExt) {
      this.fileExt = this.shortExtMap[this.fileExt.toUpperCase()] || this.fileExt.toUpperCase();
    } else {
      this.fileExt = 'x_x';
    }
  }

  public getFileExtFromMimeType(mimeType: string): string {
    return mimeType.split('/')[1];
  }
}
