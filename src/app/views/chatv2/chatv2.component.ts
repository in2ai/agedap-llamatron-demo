import { CommonModule, DatePipe, NgFor } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { ChatService } from 'src/app/service/chat.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AppService } from 'src/app/service/app.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

type Message = {
  id?: string;
  type: 'user' | 'model' | 'system' | 'external';
  message: string;
  createdAt?: string; // ISO string UTC
  updatedAt?: string; // ISO string UTC
};

@Component({
  selector: 'app-chat-v2',
  templateUrl: './chatv2.component.html',
  styles: [':host { width: 100%; height: 100%; }'],
  imports: [
    MarkdownModule,
    CommonModule,
    NgFor,
    ReactiveFormsModule,
    ButtonModule,
    TranslateModule,
    DatePipe,
    ProgressSpinnerModule,
    ConfirmDialog,
  ],
  providers: [ConfirmationService],
})
export class ChatV2Component implements OnInit, OnDestroy, AfterViewInit {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  public chatId: string = '';

  chat!: any;

  @ViewChild('chatRef') chatRef!: ElementRef;
  public headerHeight: number = document.getElementById('header')?.offsetHeight || 0;
  public isChatLoaded: boolean = false;
  public generatingResponse: boolean = false;
  public errorMessage?: string;
  public form!: FormGroup;
  public messages: Message[] = [];
  public workOffers: any[] = [];
  public myPkey!: string;
  public modelLoaded: boolean = false;

  constructor(
    private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private translateService: TranslateService,
    private chatService: ChatService,
    private appService: AppService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    // Recover chat data
    let appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
    if (appConfig && appConfig.config) appConfig = appConfig.config;
    if (appConfig && appConfig.publicKey) this.myPkey = appConfig.publicKey;
    this.modelLoaded = appConfig.modelPath ? true : false;

    this.activatedRoute.params.subscribe(async (params) => {
      if (this.chatId) {
        await (window as any).electronAPI.runNodeCode({
          func: 'unloadChat',
          chatId: this.chatId,
        });
        console.log('Unloaded chat with id: ', this.chatId);
      }
      this.isChatLoaded = false;
      this.generatingResponse = false;
      this.errorMessage = undefined;
      this.messages = [];
      this.workOffers = [];
      this.chatId = params['id'];

      if (this.chatId === 'new') {
        const queryParams: any = this.activatedRoute.snapshot.queryParams;
        if (queryParams.type === 'text' && queryParams.message) {
          const message = queryParams.message;
          console.log('New chat with message: ', message);
          const response = await (window as any).electronAPI.runNodeCode({
            func: 'newChat',
            type: 'text',
            name: message,
          });
          this.router.navigate(['/chat', response.chat.id]);
          this.appService.sendData({
            newChat: response.chat,
          });
          this.chatId = response.chat.id;
          await this.initChat();
          this.form.get('message')?.setValue(message);
          this.sendMessage();
        } else if (queryParams.type === 'plugin' && queryParams.value) {
          const plugin = queryParams.value;
          console.log('New chat with plugin: ', plugin);
          if (plugin === 'workOffers') {
            this.confirmationService.confirm({
              header: 'Ofertas de empleo',
              icon: 'pi pi-info',
              closable: false,
              acceptButtonProps: {
                label: 'Continuar',
                severity: 'primary',
              },
              rejectVisible: false,
              message:
                'A continuación deberás seleccionar tu curriculum vitae de exportación de LinkedIn para que podamos buscar ofertas de empleo que se ajusten a tu perfil.',
              accept: async () => {
                const response = await (window as any).electronAPI.runNodeCode({
                  func: 'selectFile',
                  name: 'Selecciona tu CV de LinkedIn',
                  extensions: ['zip'],
                });
                if (response.filePaths.length === 0) {
                  this.router.navigate(['/config']);
                } else {
                  const cvPath = response.filePaths[0];
                  const newChatResponse = await (window as any).electronAPI.runNodeCode({
                    func: 'newChat',
                    name: 'Ofertas de empleo',
                    type: 'plugin',
                    plugin: 'workOffers',
                    documents: [
                      {
                        type: 'linkedin',
                        path: cvPath,
                      },
                    ],
                  });
                  this.router.navigate(['/chat', newChatResponse.chat.id]);
                  this.appService.sendData({
                    newChat: newChatResponse.chat,
                  });
                  this.chatId = newChatResponse.chat.id;
                  await this.initChat();
                }
              },
            });
          }
        }
      } else this.initChat();
    });

    this.activateChat();
  }

  async initChat() {
    try {
      this.isChatLoaded = false;
      this.generatingResponse = false;
      this.errorMessage = undefined;

      this.chat = await this.chatService.getChat(this.chatId);
      console.log('Chat data recovered: ', this.chat);
      this.form = this.fb.group({
        message: [''],
      });
      if (!this.modelLoaded) this.form.get('message')?.disable();
      this.isChatLoaded = true;
      this.loadChat();
    } catch (error) {
      console.log(`//Error recovering chat info: ${error}`);
      this.errorMessage =
        'No se pudo recuperar la información del chat. Por favor, inténtalo de nuevo más tarde.';
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

  async loadChat() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'loadChat',
        chatId: this.chatId,
      });
      console.log('response from loadChat: ', response);
      //Pintar mensajes
      if (response.messages.length > 0) {
        this.messages = response.messages;
        this.processMessages();
        this.changeDetector.detectChanges();
      }
      this.scrollToBottom(false);
    } catch (error) {
      console.log(`//Error loading chat: ${error}`);
    }
  }

  scrollToBottom(smooth: boolean = true) {
    if (this.chatRef && this.chatRef.nativeElement) {
      setTimeout(() => {
        this.chatRef.nativeElement.scrollTo({
          top: this.chatRef.nativeElement.scrollHeight,
          behavior: smooth ? 'smooth' : 'instant',
        });
      }, 100);
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
            const date = new Date();
            this.messages.push({
              type: 'model',
              message: newContent,
              createdAt: date.toISOString(),
            });
          }
        } else {
          const date = new Date();
          this.messages.push({ type: 'model', message: newContent, createdAt: date.toISOString() });
        }
        this.changeDetector.detectChanges();
        this.scrollToBottom();
      } else if (data.func === 'stopGeneratingResponse' && data.chatId === this.chatId) {
        this.generatingResponse = false;
        this.form.get('message')?.enable();
      }
    });

    (window as any).electronAPI.onNewExternalMessage((event: any, data: any) => {
      if (data.func === 'onNewExternalMessage' && data.chatId === this.chatId) {
        const { content, type } = data;
        console.log('New external message received: ', content);
        this.messages.push({
          type: type || 'external',
          message: content,
          createdAt: new Date().toISOString(),
        });
        this.processMessage(content, this.messages.length - 1);
        this.changeDetector.detectChanges();
        this.scrollToBottom();
        this.generatingResponse = false;
        this.form.get('message')?.enable();
      }
    });
  }

  // Chat interaction
  async sendMessage() {
    const date = new Date();
    const message = this.form.get('message')?.value;
    if (message.length === 0) return;
    this.form.get('message')?.setValue('');
    if (!message) return;

    this.form.get('message')?.disable();

    if (this.chat.type != 'online') {
      this.messages.push({ type: 'user', message, createdAt: date.toISOString() });
      this.scrollToBottom();
    }

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
      this.scrollToBottom();
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
    console.log('Work offer clicked: ', workOffer);
    const response = await (window as any).electronAPI.runNodeCode({
      func: 'newChat',
      type: 'online',
      name: 'Conversación sobre ' + workOffer.title,
      description: 'Conversación con el autor de la oferta ' + workOffer.title,
      authors: [this.myPkey, workOffer.authorPublicKey],
      relay: workOffer.relayUrl,
    });
    console.log('New chat response: ', response);
    this.router.navigate(['/chat', response.chat.id]);
    this.appService.sendData({
      newChat: response.chat,
    });
  }
}
