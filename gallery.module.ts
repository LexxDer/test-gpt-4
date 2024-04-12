import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreSwiperModule } from '@lk/core-ui-kit/lib/swiper';
import { CoreButtonModule } from '@lk/core-ui-kit/lib/button';
import { CoreDividerModule } from '@lk/core-ui-kit/lib/divider';
import { FileSizeModule } from '@lk/core-ui-kit/lib/pipes';
import { GalleryComponent } from './gallery.component';
import { GalleryDetailsComponent } from './gallery-details/gallery-details.component';
import { GalleryZoomingComponent } from './gallery-zooming/gallery-zooming.component';
import { GalleryFreeSpaceErrorModalComponent } from './gallery-free-space-error-modal/gallery-free-space-error-modal.component';
import { GalleryRemoveModalComponent } from './gallery-remove-modal/gallery-remove-modal.component';
import { GallerySelectableFileComponent } from './gallery-selectable-file/gallery-selectable-file.component';
import { GalleryDetailsModalComponent } from './gallery-details-modal/gallery-details-modal.component';
import { GallerySliderComponent } from './gallery-slider/gallery-slider.component';
import { FileExtensionIconComponent } from './file-extension-icon/file-extension-icon.component';

@NgModule({
  declarations: [
    GalleryComponent,
    GalleryDetailsComponent,
    GalleryZoomingComponent,
    GalleryFreeSpaceErrorModalComponent,
    GalleryRemoveModalComponent,
    GallerySelectableFileComponent,
    GalleryDetailsModalComponent,
    GallerySliderComponent,
    FileExtensionIconComponent,
  ],
  exports: [GalleryComponent, GallerySelectableFileComponent],
  imports: [CommonModule, CoreSwiperModule, CoreButtonModule, CoreDividerModule, FileSizeModule],
})
export class GalleryModule {}
