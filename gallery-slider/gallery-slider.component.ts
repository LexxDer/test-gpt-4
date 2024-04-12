import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { IGalleryFile } from '../gallery.interface';
import { GalleryService } from '../gallery.service';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isMobile, isPad } from '@lk/core-ui-kit/lib/utils';
import { OnDestroyClass } from '@lk/core-ui-kit/lib/core';

@Component({
  selector: 'core-gallery-slider',
  templateUrl: './gallery-slider.component.html',
  styleUrls: ['./gallery-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GallerySliderComponent extends OnDestroyClass implements AfterViewInit, OnChanges {
  @Input() public files!: IGalleryFile[];
  @Output() public previewClick = new EventEmitter<number>();

  @ViewChild('slides') private slidesContainer: ElementRef | undefined;

  public isTouchDevice = isMobile() || isPad();

  public showPreviousButton = false;
  public showNextButton = false;

  constructor(
    private galleryService: GalleryService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  public ngAfterViewInit(): void {
    this.initWidget();
  }

  public ngOnChanges({ files }: SimpleChanges): void {
    if (files && !files.firstChange) {
      setTimeout(() => {
        this.checkNavButtons(this.slidesContainer?.nativeElement);
      });
    }
  }

  private initWidget(): void {
    if (this.slidesContainer?.nativeElement) {
      this.checkNavButtons(this.slidesContainer.nativeElement);

      if (!this.isTouchDevice) {
        fromEvent<WheelEvent>(this.slidesContainer.nativeElement, 'wheel')
          .pipe(takeUntil(this._onDestroy$))
          .subscribe((event: WheelEvent) => {
            this.onWheelScroll(event);
          });

        fromEvent<Event>(this.slidesContainer.nativeElement, 'scroll')
          .pipe(takeUntil(this._onDestroy$))
          .subscribe((event: Event) => {
            this.checkNavButtons(event.target as HTMLDivElement);
          });
      }
    }
  }

  private onWheelScroll($event: WheelEvent): void {
    $event.stopPropagation();
    $event.preventDefault();
    const el = this.slidesContainer?.nativeElement;
    if (el) {
      if ($event.deltaY > 0) {
        this.moveRight();
      } else if ($event.deltaY < 0) {
        this.moveLeft();
      }
    }
  }

  private checkNavButtons(target: HTMLDivElement | null): void {
    if (this.isTouchDevice) {
      this.showPreviousButton = false;
      this.showNextButton = false;
      return;
    }
    if (target) {
      const showPreviousButton = target.scrollLeft > 0;
      const showNextButton = target.scrollLeft + target.clientWidth + 1 < target.scrollWidth;
      if (showPreviousButton != this.showPreviousButton || showNextButton != this.showNextButton) {
        this.showPreviousButton = showPreviousButton;
        this.showNextButton = showNextButton;
        this.cdr.detectChanges();
      }
    }
  }

  public getPreviewSrc(file: IGalleryFile): string {
    return this.galleryService.getPreviewSrc(file);
  }

  public handleImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.galleryService.getErrorImageSrc();
  }

  public moveLeft(): void {
    const el = this.slidesContainer?.nativeElement;
    if (el) {
      const slideWidth = el.scrollWidth / this.files.length;
      el.scrollLeft = Math.max(el.scrollLeft - slideWidth, 0);
    }
  }

  public moveRight(): void {
    const el = this.slidesContainer?.nativeElement;
    if (el) {
      const slideWidth = el.scrollWidth / this.files.length;
      el.scrollLeft = Math.min(el.scrollLeft + slideWidth, el.scrollWidth);
    }
  }

  public onPreviewClick(index: number): void {
    this.previewClick.emit(index);
  }
}
