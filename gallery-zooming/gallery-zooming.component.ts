import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { isTouchDevice } from '@lk/core-ui-kit/lib/utils';
import { GalleryService } from '../gallery.service';
import { IImageProperties } from '../gallery.interface';
import { ZOOM_ACTIONS_ENUM, ZOOM_STATE } from '../gallery.enums';
import { OnDestroyClass } from '@lk/core-ui-kit/lib/core';

@Component({
  selector: 'core-gallery-zooming',
  templateUrl: './gallery-zooming.component.html',
  styleUrls: ['./gallery-zooming.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryZoomingComponent extends OnDestroyClass implements OnInit, OnChanges, AfterViewInit {
  @Input() public imageSrc = '';
  @Input() public zoom$: BehaviorSubject<ZOOM_ACTIONS_ENUM> | undefined;
  @Input() public isZoomable = true;
  @Output() public zoomChanged = new EventEmitter<ZOOM_STATE>();

  @ViewChild('imageContainer', { static: true }) public imageContainer: ElementRef | undefined;
  @ViewChild('imageElement', { static: true }) public imageElement: ElementRef | undefined;

  public isTouchDevice = isTouchDevice();
  public imageProperties: IImageProperties = {
    zoom: 1,
    zoomSpeed: 0.5,
    zoomMax: 15,
    zoomMin: 1,
    positionX: 0,
    positionY: 0,
    isPressed: false,
    lastPosition: null,
    domRectImage: null,
    domRectContainer: null,
  };
  private allEvents$: Observable<any> | undefined;
  private events = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup', 'scroll', 'wheel'];
  private eventsWithoutTouch = this.events.filter(item => !['touchstart', 'touchmove', 'touchend'].includes(item));
  private eventsWithoutMouse = this.events.filter(item => !['mousedown', 'mouseup'].includes(item));
  private eventsMap: Map<string, Observable<any> | null> = new Map<string, BehaviorSubject<any> | null>();

  public imageLoading = false;
  public brokenImage = false;

  constructor(
    private galleryService: GalleryService,
    private renderer: Renderer2,
  ) {
    super();
  }

  public ngOnInit(): void {
    const events = this.isTouchDevice ? 'eventsWithoutMouse' : 'eventsWithoutTouch';
    this[events].forEach(item => {
      this.eventsMap.set(item, null);
    });
  }

  public ngAfterViewInit(): void {
    Array.from(this.eventsMap.keys()).forEach(item =>
      this.eventsMap.set(
        item,
        fromEvent(this.imageContainer?.nativeElement, item).pipe(filter(event => this.targetFilter(event))),
      ),
    );

    this.allEvents$ = merge(Array.from(this.eventsMap.values()));
    this.allEvents$?.pipe(takeUntil(this._onDestroy$)).subscribe((data: Observable<any>) => {
      data.pipe(takeUntil(this._onDestroy$)).subscribe(event => {
        this.processImage(event);
      });
    });

    this.zoom$?.pipe(takeUntil(this._onDestroy$)).subscribe(action => {
      this.setImageZoom(action);
    });
  }

  public ngOnChanges({ imageSrc }: SimpleChanges): void {
    if (imageSrc) {
      this.imageLoading = true;
      this.brokenImage = false;
    }
  }

  public imageLoaded(): void {
    this.imageLoading = false;
  }

  private targetFilter(event: any): boolean {
    return event.target === this.imageElement?.nativeElement || event.target === this.imageContainer?.nativeElement;
  }

  private getEventClientPosition(event: any): { x: number; y: number } {
    const x = this.isTouchDevice ? event.touches[0].clientX : event.x;
    const y = this.isTouchDevice ? event.touches[0].clientY : event.y;
    return { x, y };
  }

  private processImage(event: any): void {
    event.preventDefault();
    if (!this.isZoomable || this.brokenImage) {
      return;
    }

    this.imageProperties.domRectImage = this.imageElement?.nativeElement?.getBoundingClientRect();
    this.imageProperties.domRectContainer = this.imageContainer?.nativeElement?.getBoundingClientRect();

    switch (event.type) {
      case 'wheel':
        event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
        break;
      case 'touchstart':
      case 'mousedown':
        this.imageProperties.isPressed = true;
        this.imageProperties.lastPosition = this.getEventClientPosition(event);
        break;
      case 'touchend':
      case 'mouseup':
        this.imageProperties.isPressed = false;
        this.imageProperties.lastPosition = null;
        break;
      case 'touchmove':
      case 'mousemove':
        this.moveEventHandler(event);
        break;
      default:
        break;
    }
    event.stopPropagation();
  }

  private movePictureAfterZoom(): void {
    this.imageProperties.domRectImage = this.imageElement?.nativeElement?.getBoundingClientRect();
    this.imageProperties.domRectContainer = this.imageContainer?.nativeElement?.getBoundingClientRect();

    if (this.imageProperties.domRectImage && this.imageProperties.domRectContainer) {
      if (this.imageProperties.domRectImage.width > this.imageProperties.domRectContainer.width) {
        const deltaLeft = this.imageProperties.domRectImage.left - this.imageProperties.domRectContainer.left;
        const deltaRight = this.imageProperties.domRectImage.right - this.imageProperties.domRectContainer.right;
        if (deltaLeft > 0) {
          this.imageProperties.positionX = this.imageProperties.positionX - deltaLeft / this.imageProperties.zoom;
        } else if (deltaRight < 0) {
          this.imageProperties.positionX = this.imageProperties.positionX - deltaRight / this.imageProperties.zoom;
        }
      }
      if (this.imageProperties.domRectImage.height > this.imageProperties.domRectContainer.height) {
        const deltaTop = this.imageProperties.domRectImage.top - this.imageProperties.domRectContainer.top;
        const deltaBottom = this.imageProperties.domRectImage.bottom - this.imageProperties.domRectContainer.bottom;
        if (deltaTop > 0) {
          this.imageProperties.positionY = this.imageProperties.positionY - deltaTop / this.imageProperties.zoom;
        } else if (deltaBottom < 0) {
          this.imageProperties.positionY = this.imageProperties.positionY - deltaBottom / this.imageProperties.zoom;
        }
      }
    }

    this.setStyle();
  }

  private getMoveSizeX(deltaX: number): number {
    if (this.imageProperties.domRectImage && this.imageProperties.domRectContainer) {
      if (deltaX > 0 && this.imageProperties.domRectImage.left >= this.imageProperties.domRectContainer.left) {
        return 0;
      }
      if (deltaX < 0 && this.imageProperties.domRectImage.right <= this.imageProperties.domRectContainer.right) {
        return 0;
      }

      if (deltaX > 0) {
        if (this.imageProperties.domRectImage.left + deltaX >= this.imageProperties.domRectContainer.left) {
          return this.imageProperties.domRectContainer.left - this.imageProperties.domRectImage.left;
        }
      } else if (deltaX < 0) {
        if (this.imageProperties.domRectImage.right + deltaX <= this.imageProperties.domRectContainer.right) {
          return this.imageProperties.domRectImage.right - this.imageProperties.domRectContainer.right;
        }
      }
    }
    return deltaX;
  }

  private getMoveSizeY(deltaY: number): number {
    if (this.imageProperties.domRectImage && this.imageProperties.domRectContainer) {
      if (deltaY > 0 && this.imageProperties.domRectImage.top >= this.imageProperties.domRectContainer.top) {
        return 0;
      }
      if (deltaY < 0 && this.imageProperties.domRectImage.bottom <= this.imageProperties.domRectContainer.bottom) {
        return 0;
      }
      if (deltaY > 0) {
        if (this.imageProperties.domRectImage.top + deltaY >= this.imageProperties.domRectContainer.top) {
          return this.imageProperties.domRectContainer.top - this.imageProperties.domRectImage.top;
        }
      } else if (deltaY < 0) {
        if (this.imageProperties.domRectImage.bottom + deltaY <= this.imageProperties.domRectContainer.bottom) {
          return this.imageProperties.domRectImage.bottom - this.imageProperties.domRectContainer.bottom;
        }
      }
    }
    return deltaY;
  }

  private moveEventHandler(event: any): void {
    if (this.imageProperties.isPressed) {
      let deltaX = 0;
      let deltaY = 0;
      if (!this.imageProperties.lastPosition) {
        this.imageProperties.lastPosition = this.getEventClientPosition(event);
      } else {
        deltaX = this.getEventClientPosition(event).x - this.imageProperties.lastPosition.x;
        deltaY = this.getEventClientPosition(event).y - this.imageProperties.lastPosition.y;
        this.imageProperties.lastPosition = this.getEventClientPosition(event);
      }

      this.imageProperties.positionX =
        this.imageProperties.positionX + this.getMoveSizeX(deltaX) / this.imageProperties.zoom;
      this.imageProperties.positionY =
        this.imageProperties.positionY + this.getMoveSizeY(deltaY) / this.imageProperties.zoom;

      this.setStyle();
    }
  }

  private setStyle(): void {
    const scale = `scale3d(${this.imageProperties.zoom}, ${this.imageProperties.zoom}, 1)`;
    const translate = `translate3d(${this.imageProperties.positionX}px, ${this.imageProperties.positionY}px, 0px)`;

    this.renderer.setStyle(this.imageElement?.nativeElement, 'transform', ` ${scale} ${translate}`);
  }

  public zoomIn(max?: boolean): void {
    max ? this.setImageZoom(ZOOM_ACTIONS_ENUM.ZOOM_MAX) : this.setImageZoom(ZOOM_ACTIONS_ENUM.ZOOM_IN);
  }

  public zoomOut(min?: boolean): void {
    min ? this.setImageZoom(ZOOM_ACTIONS_ENUM.ZOOM_CLEAR) : this.setImageZoom(ZOOM_ACTIONS_ENUM.ZOOM_OUT);
    this.movePictureAfterZoom();
  }

  private setImageZoom(zoomType: ZOOM_ACTIONS_ENUM): void {
    let zoom;
    switch (zoomType) {
      case ZOOM_ACTIONS_ENUM.ZOOM_IN:
        zoom = this.imageProperties.zoom + this.imageProperties.zoomSpeed;
        break;
      case ZOOM_ACTIONS_ENUM.ZOOM_OUT:
        zoom = this.imageProperties.zoom - this.imageProperties.zoomSpeed;
        if (this.imageProperties.domRectImage && this.imageProperties.domRectContainer) {
          if (this.imageProperties?.domRectImage?.width <= this.imageProperties?.domRectContainer?.width) {
            this.imageProperties.positionX = 0;
          }
          if (this.imageProperties?.domRectImage?.height <= this.imageProperties?.domRectContainer?.height) {
            this.imageProperties.positionY = 0;
          }
        }
        if (zoom === this.imageProperties.zoomMin) {
          this.imageProperties.positionX = 0;
          this.imageProperties.positionY = 0;
        }
        break;
      case ZOOM_ACTIONS_ENUM.ZOOM_CLEAR:
        zoom = 1;
        this.imageProperties.positionX = 0;
        this.imageProperties.positionY = 0;
        break;
      case ZOOM_ACTIONS_ENUM.ZOOM_MAX:
        zoom = this.imageProperties.zoomMax - 1;
        break;
      default:
        zoom = 1;
        break;
    }
    if (zoom >= 1 && zoom < this.imageProperties.zoomMax) {
      this.imageProperties.zoom = zoom;
      this.zoomChanged.emit(zoom === this.imageProperties.zoomMin ? ZOOM_STATE.ZOOM_IN : ZOOM_STATE.ZOOM_OUT);
    }
    this.setStyle();
  }

  public handleImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.galleryService.getErrorImageSrc();
    this.brokenImage = true;
  }
}
