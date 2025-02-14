import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceDetailComponent } from './work-space-detail.component';

describe('WorkSpaceDetailComponent', () => {
  let component: WorkSpaceDetailComponent;
  let fixture: ComponentFixture<WorkSpaceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkSpaceDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkSpaceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
