import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { isPdf } from '@lk/core-ui-kit/lib/utils';
import { IGalleryConfig, IGalleryFile } from './gallery.interface';
import { IMG_STUB } from './gallery-constants';

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private config: IGalleryConfig = {
    storageApi: '',
  };

  constructor(private http: HttpClient) {}

  public setConfig(config: IGalleryConfig): void {
    this.config = config;
  }

  public getFileBlob(url: string): Observable<Blob> {
    return this.http.get(`${url}`, {
      withCredentials: true,
      responseType: 'blob',
    });
  }

  public downloadBlob(blob: Blob, name = ''): void {
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
      window.navigator.msSaveBlob(blob, `${name}`);
      return;
    }

    const link = document.createElement('a');
    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute('download', `${name}`);
    link.click();
  }

  public openBlob(blob: Blob): void {
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  }

  public getPreviewSrc(file: IGalleryFile, sizeCode = 1): string {
    if (!file.previewType) {
      return '';
    }

    let previewType = file.previewType;
    if (sizeCode === 2) {
      if (file.previewType2) {
        previewType = file.previewType2;
      } else {
        previewType = this.isPdf(file) ? file.previewType : file.objectType;
      }
    }

    return encodeURI(
      `${this.config.storageApi}files/${file.objectId}/${previewType}/download?mnemonic=${file?.mnemonic}`,
    );
  }

  public getErrorImageSrc(): string {
    return IMG_STUB;
  }

  public isPdf(file: IGalleryFile): boolean {
    return isPdf(file.mimeType);
  }

  public getDownloadLink(file: IGalleryFile): string {
    return encodeURI(
      `${this.config.storageApi}files/${file.objectId}/${file.objectType}/download?mnemonic=${file?.mnemonic}`,
    );
  }

  public static getFilesTotalSize(files: IGalleryFile[]): number {
    return files.reduce((sum, item) => sum + item.fileSize || 0, 0);
  }
}
