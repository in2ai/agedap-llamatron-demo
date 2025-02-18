import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceDocumentsComponent } from './work-space-documents.component';

describe('WorkSpaceDocumentsComponent', () => {
  let component: WorkSpaceDocumentsComponent;
  let fixture: ComponentFixture<WorkSpaceDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkSpaceDocumentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkSpaceDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
