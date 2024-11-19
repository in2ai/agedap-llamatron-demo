import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

type Message = {
  type: 'user' | 'model';
  message: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: [],
})
export class ChatComponent implements OnInit {
  @ViewChild('chat') chat!: ElementRef;
  public headerHeight: number =
    document.getElementById('header')?.offsetHeight || 0;
  public chatLoaded: boolean = false;
  public generatingResponse: boolean = false;
  public errorMessage?: string;
  public form!: FormGroup;
  public messages: Message[] = [];

  constructor(
    private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      message: [''],
    });

    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'llm-state',
      });

      if (response && response.llama.loaded && response.model.loaded) {
        this.loadChatSession();
      } else {
        console.log('NGONINTI ERROR RESPONSE: ', response);
        this.errorMessage = this.translateService.instant(
          'COMMON.MODEL_NOT_LOADED'
        );
      }

      (window as any).electronAPI.onPartialResponse((event: any, data: any) => {
        if (data.func === 'partial-response') {
          this.messages = data.chatSession.simplifiedChat;
          this.changeDetector.detectChanges();
          this.chat.nativeElement.scrollTop =
            this.chat.nativeElement.scrollHeight;
        } else if (data.func === 'stop-generating-response') {
          this.generatingResponse = false;
          this.form.get('message')?.enable();
        }
      });
    } catch (error) {
      console.log('NGONINIT ERROR: ', error);
      this.errorMessage = this.translateService.instant('COMMON.ERROR');
    }
  }

  async loadChatSession() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'create-chat-session',
      });

      if (response && response.chatSession)
        this.chatLoaded = response.chatSession.loaded;
      else {
        console.log('LOAD CHAT SESSION ERROR RESPONSE: ', response);
        this.errorMessage = this.translateService.instant('COMMON.ERROR');
      }
    } catch (error) {
      console.log('LOAD CHAT SESSION ERROR: ', error);
      this.errorMessage = this.translateService.instant('COMMON.ERROR');
      this.chatLoaded = false;
    }
  }

  async sendMessage() {
    const message = this.form.get('message')?.value;
    this.form.get('message')?.setValue('');
    if (!message) return;
    this.form.get('message')?.disable();
    this.messages.push({ type: 'user', message });
    this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;

    try {
      this.generatingResponse = true;
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'send-message-stream',
        message: message,
      });
      this.messages = response.chatSession.simplifiedChat;
      this.changeDetector.detectChanges();
      this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
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
        func: 'stop-generating-response',
      });
    } catch (error) {
      console.log(error);
    }
  }
}
