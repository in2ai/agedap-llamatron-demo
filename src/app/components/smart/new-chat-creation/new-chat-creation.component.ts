import { CommonModule, JsonPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Chat } from 'src/app/models';
import { ButtonComponent } from '../../ui/button/button.component';
import { FieldComponent } from '../field/field.component';
import { TextareaComponent } from '../textarea/textarea.component';

@Component({
  selector: 'app-new-chat-creation',
  templateUrl: './new-chat-creation.component.html',
  styles: [':host { width: 100%; height: 100%; }'],
  imports: [
    FieldComponent,
    TextareaComponent,
    TranslateModule,
    ButtonComponent,
    JsonPipe,
    CommonModule,
  ],
})
export class NewChatCreationComponent implements OnInit {
  public chatForm!: FormGroup;

  @Input()
  workSpaceId: string = '';

  @Output()
  onClose = new EventEmitter<any>();

  @Output()
  onCreate = new EventEmitter<Chat>();

  ngOnInit() {
    this.chatForm = new FormGroup({
      workspaceId: new FormControl(this.workSpaceId),
      name: new FormControl(''),
      description: new FormControl(''),
    });
  }

  closeHandler() {
    this.onClose.emit();
  }

  createHandler() {
    this.onCreate.emit(this.chatForm.value);
  }

  getControl(name: string) {
    return this.chatForm.get(name) as FormControl;
  }
}
