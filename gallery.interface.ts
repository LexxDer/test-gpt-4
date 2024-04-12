import { BehaviorSubject, Observable } from 'rxjs';

export interface IGalleryConfig {
  storageApi: string;
}

export interface IGalleryFile {
  created: string;
  fileExt: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mnemonic: string;
  objectId: number;
  objectType: number;
  previewType?: number;
  previewType2?: number;
  uploadId: string;
}

export interface ISelectableFile {
  selected?: boolean;
}

export interface IImageProperties {
  zoom: number;
  zoomSpeed: number;
  zoomMax: number;
  zoomMin: number;
  positionX: number;
  positionY: number;
  isPressed: boolean;
  lastPosition: { x: number; y: number } | null;
  domRectImage: DOMRect | null;
  domRectContainer: DOMRect | null;
}

export interface IFileKey {
  objectId: string;
  objectType: string;
  mnemonic: string;
}

export interface IFileRemoveModalData {
  currentFilesSize: number;
  maxFilesSize: number;
  title: string;
  files: IGalleryFile[];
  deleteAllFiles: () => void;
  deleteSelectedFiles: (files: IGalleryFile[]) => void;
}

export interface IDetailsModalData {
  title: string;
  files$: BehaviorSubject<IGalleryFile[]>;
  index: number;
  delete: (file: IGalleryFile) => Observable<void>;
}

export interface IFreeSpaceErrorModalData {
  currentFilesSize: number;
  maxFilesSize: number;
  title: string;
  apply: (currentFilesSize: number, maxFilesSize: number, title: string) => void;
}
