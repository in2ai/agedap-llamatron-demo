import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceTypeRendererComponent } from './work-space-type-renderer.component';

describe('WorkSpaceTypeRendererComponent', () => {
  let component: WorkSpaceTypeRendererComponent;
  let fixture: ComponentFixture<WorkSpaceTypeRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkSpaceTypeRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkSpaceTypeRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
