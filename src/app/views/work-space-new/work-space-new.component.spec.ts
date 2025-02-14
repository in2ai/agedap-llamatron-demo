import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceNewComponent } from './work-space-new.component';

describe('WorkSpaceNewComponent', () => {
  let component: WorkSpaceNewComponent;
  let fixture: ComponentFixture<WorkSpaceNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkSpaceNewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkSpaceNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
