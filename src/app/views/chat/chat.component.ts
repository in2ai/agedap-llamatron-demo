import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { Chat } from 'src/app/models';
import { ChatService } from 'src/app/service/chat.service';

type Message = {
  type: 'user' | 'model';
  message: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styles: [':host { width: 100%; }'],
  imports: [MarkdownModule, CommonModule, NgFor, ReactiveFormsModule, ButtonModule],
})
export class ChatComponent implements OnInit {
  chat!: Chat;

  @Input()
  chatId = 'chat_1';

  @ViewChild('chatRef') chatRef!: ElementRef;
  public headerHeight: number = document.getElementById('header')?.offsetHeight || 0;
  public chatLoaded: boolean = false;
  public generatingResponse: boolean = false;
  public errorMessage?: string;
  public form!: FormGroup;
  public messages: Message[] = [];

  constructor(
    private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private translateService: TranslateService,
    private chatService: ChatService
  ) {}

  async ngOnInit() {
    // Recover chat information
    console.log('//CHAT ID: ', this.chatId);
    try {
      this.chat = await this.chatService.getChat(this.chatId);
      console.log('//CHAT: ', this.chat);
    } catch (error) {
      console.log(error);
    }

    console.log('//CHAT: ', this.chat);
    //
    this.form = this.fb.group({
      message: [''],
    });

    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'state',
      });

      if (response && response.modelPath) {
        this.chatLoaded = true;
      } else {
        this.errorMessage = this.translateService.instant('COMMON.MODEL_NOT_LOADED');
      }

      (window as any).electronAPI.onPartialResponse((event: any, data: any) => {
        console.log('//REQUEST OK: ', data);
        if (data.func === 'partial-response' && data.chat_id === this.chatId) {
          const newContent = data.content;
          //if last message is from model, update it else add new message
          if (this.messages.length > 0) {
            if (this.messages[this.messages.length - 1].type === 'model') {
              this.messages[this.messages.length - 1].message = newContent;
            } else {
              this.messages.push({ type: 'model', message: newContent });
            }
          } else {
            this.messages.push({ type: 'model', message: newContent });
          }
          console.log('//Messages: ', this.messages);
          this.changeDetector.detectChanges();
          this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
        } else if (data.func === 'stop_generating_response' && data.chat_id === this.chatId) {
          console.log('Stopped generating response');
          this.generatingResponse = false;
          this.form.get('message')?.enable();
        }
      });
    } catch (error) {
      console.log(error);
      this.errorMessage = this.translateService.instant('COMMON.ERROR');
    }
  }

  async sendMessage() {
    const message = this.form.get('message')?.value;
    this.form.get('message')?.setValue('');
    if (!message) return;
    this.form.get('message')?.disable();
    this.messages.push({ type: 'user', message });
    this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;

    try {
      this.generatingResponse = true;
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'sendMessage',
        message: message,
        chatId: this.chatId,
      });

      this.messages = response.messages;
      this.changeDetector.detectChanges();
      this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
    } catch (error) {
      console.log(error);
    } finally {
      this.generatingResponse = false;
      this.form.get('message')?.enable();
    }
  }

  async stopGeneratingResponse() {
    try {
      await (window as any).electronAPI.runNodeCode({
        func: 'stopGeneratingResponse',
        chatId: this.chatId,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
