import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewChatCreationComponent } from './new-chat-creation.component';

describe('NewChatCreationComponent', () => {
  let component: NewChatCreationComponent;
  let fixture: ComponentFixture<NewChatCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewChatCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewChatCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
