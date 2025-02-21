import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceDeleteRendererComponent } from './work-space-delete-renderer.component';

describe('WorkSpaceDeleteRendererComponent', () => {
  let component: WorkSpaceDeleteRendererComponent;
  let fixture: ComponentFixture<WorkSpaceDeleteRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkSpaceDeleteRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkSpaceDeleteRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
