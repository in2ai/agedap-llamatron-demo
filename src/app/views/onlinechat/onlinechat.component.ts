import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Buffer } from 'buffer';
import { MarkdownModule } from 'ngx-markdown';
import { EventTemplate } from 'nostr-tools/core';
import { finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import { ButtonModule } from 'primeng/button';
import { OnlineChat } from 'src/app/models/onlinechat';
import { OnlineChatService } from 'src/app/service/onlinechat.service';

window.Buffer = Buffer;

@Component({
  selector: 'app-onlinechat',
  templateUrl: './onlinechat.component.html',
  styles: [':host { width: 100%; }'],
  imports: [CommonModule, ButtonModule, ReactiveFormsModule, MarkdownModule],
})
export class OnlineChatComponent implements OnInit {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  isChatLoaded: boolean = false;
  onlineChatId: string = '';
  onlineChat!: OnlineChat;
  public form!: FormGroup;
  error: string | null = null;
  messages: any[] = [];
  appConfig: any = null;

  constructor(
    private fb: FormBuilder,
    private onlineChatService: OnlineChatService
  ) {}

  async ngOnInit(): Promise<void> {
    this.appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
    this.appConfig = this.appConfig.config;

    this.onlineChatId = this.activatedRoute.snapshot.params['chatId'] ?? '';
    this.form = this.fb.group({
      message: [''],
    });

    if (!this.onlineChatId) this.error = 'No chat id provided';
    else {
      try {
        this.onlineChat = await this.onlineChatService.getOnlineChat(this.onlineChatId);
        this.isChatLoaded = true;
        this.subscribeToChat();
      } catch (error) {
        this.error = 'Error loading chat';
        console.log(error);
      }
    }
  }

  async subscribeToChat() {
    const relay = await Relay.connect(this.onlineChat.relay);
    /*const sub = */ relay.subscribe(
      [
        {
          kinds: [1],
          authors: this.onlineChat.authors.filter((author) => author !== undefined),
          '#t': this.onlineChat.tags,
        },
      ],
      {
        onevent: (event) => {
          console.log('Event:', event);
          const { content, pubkey, created_at } = event;
          let type = 'external';
          if (pubkey === this.appConfig.publicKey) type = 'user';
          const message = {
            message: content,
            type: type,
            createdAt: created_at,
          };
          this.messages.push(message);
        },
        oneose() {
          console.log('Event:', 'oneose');
          //sub.close();
        },
      }
    );
  }

  async sendMessage() {
    const tags = this.onlineChat.tags.map((tag) => ['t', tag]);
    const eventTemplate: EventTemplate = {
      kind: 1,
      tags: tags,
      content: this.form.value.message,
      created_at: Math.floor(Date.now() / 1000),
    };
    console.log('Event:', eventTemplate);
    const sk = new Uint8Array(Buffer.from(this.appConfig.secretKey, 'base64'));
    const signedEvent = finalizeEvent(eventTemplate, sk);
    const relay = await Relay.connect(this.onlineChat.relay);
    await relay.publish(signedEvent);
    relay.close();
    this.form.reset();
  }
}
