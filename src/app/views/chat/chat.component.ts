import { CommonModule, DatePipe, NgFor } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
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
  id?: string;
  type: 'user' | 'model' | 'system' | 'external';
  message: string;
  createdAt?: string; // ISO string UTC
  updatedAt?: string; // ISO string UTC
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
    DatePipe,
  ],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
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
  public workOffers: any[] = [];
  public myPkey!: string;

  constructor(
    private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private translateService: TranslateService,
    private chatService: ChatService
  ) {}

  async ngOnInit() {
    // Recover chat data
    let appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
    if (appConfig && appConfig.config) appConfig = appConfig.config;
    if (appConfig && appConfig.publicKey) this.myPkey = appConfig.publicKey;

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

  ngAfterViewInit() {
    document.body.addEventListener('click', this.handleGlobalClick.bind(this));
  }

  handleGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a[href^="workoffer:"]') as HTMLAnchorElement;

    if (anchor) {
      event.preventDefault();

      const href = anchor.getAttribute('href');
      const index = Number(href?.split(':')[1]);

      if (!isNaN(index)) {
        this.onWorkOfferClick(index);
      }
    }
  }

  ngOnDestroy(): void {
    console.log(`//Chat component destroyed`);
    (window as any).electronAPI.runNodeCode({
      func: 'unloadChat',
      chatId: this.chatId,
    });
    document.body.removeEventListener('click', this.handleGlobalClick.bind(this));
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
        this.processMessages();
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
        this.processMessage(content, this.messages.length - 1);
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

  processMessages() {
    for (let i = 0; i < this.messages.length; i++) {
      this.processMessage(this.messages[i].message, i);
    }
  }

  processMessage(content: string, index: number) {
    let newContent = content;
    const start = content.indexOf('**{{object:');
    if (start !== -1) {
      const end = content.indexOf(':object}}**', start);
      if (end !== -1) {
        const object = content.substring(start + 11, end);
        try {
          const jsonObject = JSON.parse(object);
          newContent = content.replace(`**{{object:${object}:object}}**`, '');

          this.workOffers.push(jsonObject);
          switch (jsonObject.type) {
            case 'workOffer': {
              newContent += `<a href="workoffer:${this.workOffers.length - 1}"><strong>Haz clic aquí si te interesa esta oferta de trabajo</strong></a>`;
              break;
            }
          }
        } catch (error) {
          console.log(`//Error parsing object: ${error}`);
        }
      }
    }
    this.messages[index].message = newContent;
  }

  async onWorkOfferClick(index: number) {
    const workOffer = this.workOffers[index];
    console.log('//Work offer clicked: ', workOffer);

    const response = await (window as any).electronAPI.runNodeCode({
      func: 'newOnlineChat',
      relay: workOffer.relayUrl,
      authors: [this.myPkey, workOffer.authorPublicKey],
      tags: [workOffer.nostrId],
    });
    console.log('//New online chat response: ', response);
    const onlineChatId = response.onlineChat.id;
    await (window as any).electronAPI.runNodeCode({
      func: 'unloadChat',
      chatId: this.chatId,
    });

    this.router.navigate([`/onlinechat/${onlineChatId}`]);
  }
}
