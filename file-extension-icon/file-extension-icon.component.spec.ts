import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExtensionIconComponent } from './file-extension-icon.component';

describe('FileExtensionIconComponent', () => {
  let component: FileExtensionIconComponent;
  let fixture: ComponentFixture<FileExtensionIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileExtensionIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileExtensionIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
