import { CommonModule, NgFor } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { Chat } from 'src/app/models';
import { ChatService } from 'src/app/service/chat.service';

type Message = {
  type: 'user' | 'model' | 'system' | 'external';
  message: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styles: [':host { width: 100%; height: 100%; }'],
  imports: [
    MarkdownModule,
    CommonModule,
    NgFor,
    ReactiveFormsModule,
    ButtonModule,
    TranslateModule,
  ],
})
export class ChatComponent implements OnInit {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  @Input()
  chatId: string = '';

  chat!: Chat;

  @ViewChild('chatRef') chatRef!: ElementRef;
  public headerHeight: number = document.getElementById('header')?.offsetHeight || 0;
  public isChatLoaded: boolean = false;
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
    // Recover chat data
    console.log('chatId', this.chatId);
    try {
      this.chat = await this.chatService.getChat(this.chatId);

      // Initialize chat form
      this.form = this.fb.group({
        message: [''],
      });

      // Check model
      this.checkModel();
    } catch (error) {
      console.log(`//Error recovering chat info: ${error}`);
    }
  }

  async checkModel() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'state',
      });

      if (response && response.modelPath) {
        this.isChatLoaded = true;

        // Check model
        this.loadChat();
      } else {
        this.errorMessage = this.translateService.instant('COMMON.MODEL_NOT_LOADED');
      }
    } catch (error) {
      console.log(`//Error recovering model state: ${error}`);
    }
  }

  async loadChat() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'loadChat',
        chatId: this.chatId,
      });
      //Pintar mensajes
      if (response.messages.length > 0) {
        this.messages = response.messages;
        this.changeDetector.detectChanges();
        this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
      }

      this.activateChat();
    } catch (error) {
      console.log(`//Error loading chat: ${error}`);
    }
  }

  activateChat() {
    (window as any).electronAPI.onPartialMessageResponse((event: any, data: any) => {
      if (data.func === 'onPartialMessageResponse' && data.chatId === this.chatId) {
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
        this.changeDetector.detectChanges();
        this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
      } else if (data.func === 'stopGeneratingResponse' && data.chatId === this.chatId) {
        this.generatingResponse = false;
        this.form.get('message')?.enable();
      }
    });

    (window as any).electronAPI.onNewExternalMessage((event: any, data: any) => {
      if (data.func === 'onNewExternalMessage' && data.chatId === this.chatId) {
        const { content } = data;
        this.messages.push({ type: 'external', message: content });
        this.changeDetector.detectChanges();
        this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
      }
    });
  }

  // Chat interaction
  async sendMessage() {
    const message = this.form.get('message')?.value;
    this.form.get('message')?.setValue('');
    if (!message) return;

    this.form.get('message')?.disable();
    this.messages.push({ type: 'user', message });
    this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;

    try {
      this.generatingResponse = true;
      await (window as any).electronAPI.runNodeCode({
        func: 'sendMessage',
        message: message,
        chatId: this.chatId,
      });

      /*
      ya viene en partialMessageResponse
      const responseMessage = response.content;
      this.messages.push({ type: 'model', message: responseMessage });*/
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

  // Interface
  async onBackToWorkspaceHandler() {
    await (window as any).electronAPI.runNodeCode({
      func: 'unloadChat',
      chatId: this.chatId,
    });
    this.router.navigate([`/workspace/${this.chat.workspaceId}`]);
  }
}
