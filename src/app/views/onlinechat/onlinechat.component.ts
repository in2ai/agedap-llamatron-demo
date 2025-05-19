import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
export class OnlineChatComponent implements OnInit, OnDestroy {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  isChatLoaded: boolean = false;
  onlineChatId: string = '';
  onlineChat!: OnlineChat;
  public form!: FormGroup;
  error: string | null = null;
  messages: any[] = [];
  appConfig: any = null;
  relay: any = null;
  sub: any = null;

  constructor(
    private fb: FormBuilder,
    private onlineChatService: OnlineChatService
  ) {}

  async ngOnInit(): Promise<void> {
    this.appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
    this.appConfig = this.appConfig.config;
    console.log('AppConfig:', this.appConfig);

    this.onlineChatId = this.activatedRoute.snapshot.params['chatId'] ?? '';
    console.log('OnlineChatId:', this.onlineChatId);

    console.log('Current route:', this.activatedRoute.snapshot.url);
    this.form = this.fb.group({
      message: [''],
    });

    if (!this.onlineChatId) this.error = 'No chat id provided';
    else {
      try {
        this.onlineChat = await this.onlineChatService.getOnlineChat(this.onlineChatId);
        console.log('OnlineChat:', this.onlineChat);
        this.isChatLoaded = true;
        this.subscribeToChat();
      } catch (error) {
        this.error = 'Error loading chat';
        console.log(error);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.close();
    }
    if (this.relay) {
      this.relay.close();
    }
  }

  async subscribeToChat() {
    this.relay = await Relay.connect(this.onlineChat.relay);
    this.sub = this.relay.subscribe(
      [
        {
          kinds: [1],
          '#t': [this.onlineChat.id],
        },
      ],
      {
        onevent: (event: any) => {
          console.log('Event:', event);
          const { content, pubkey, created_at } = event;
          let type = 'external';
          if (pubkey === this.appConfig.publicKey) type = 'user';
          const message = {
            pubkey: pubkey,
            message: content,
            type: type,
            createdAt: created_at * 1000,
          };
          this.messages.push(message);
        },
        oneose: () => {
          console.log('Event:', 'oneose');
          //sub.close();
        },
      }
    );
  }

  async sendMessage() {
    await this.insertRecordIfNotExists();
    const eventTemplate: EventTemplate = {
      kind: 1,
      tags: [['t', this.onlineChat.id]],
      content: this.form.value.message,
      created_at: Math.floor(Date.now() / 1000),
    };
    console.log('Event:', eventTemplate);
    const sk = new Uint8Array(Buffer.from(this.appConfig.secretKey, 'base64'));
    const signedEvent = finalizeEvent(eventTemplate, sk);
    //const relay = await Relay.connect(this.onlineChat.relay);
    await this.relay.publish(signedEvent);
    //relay.close();
    this.form.reset();
  }

  async insertRecordIfNotExists() {
    if (this.messages.length === 0) {
      const eventTemplate: EventTemplate = {
        kind: 3,
        tags: [
          ['p', this.onlineChat.authors[0]],
          ['p', this.onlineChat.authors[1]],
          ['t', this.onlineChat.id],
        ],
        content: '',
        created_at: Math.floor(Date.now() / 1000),
      };
      console.log('Event record:', eventTemplate);
      const sk = new Uint8Array(Buffer.from(this.appConfig.secretKey, 'base64'));
      const signedEvent = finalizeEvent(eventTemplate, sk);
      await this.relay.publish(signedEvent);
      console.log('Event published record:', signedEvent);
    }
  }
}
