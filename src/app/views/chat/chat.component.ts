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
  chatId = 'chat_1';

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
        func: 'state',
      });

      if (response && response.modelPath) {
        this.chatLoaded = true;
      } else {
        this.errorMessage = this.translateService.instant(
          'COMMON.MODEL_NOT_LOADED'
        );
      }

      (window as any).electronAPI.onPartialResponse((event: any, data: any) => {
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
          this.changeDetector.detectChanges();
          this.chat.nativeElement.scrollTop =
            this.chat.nativeElement.scrollHeight;
        } else if (
          data.func === 'stop_generating_response' &&
          data.chat_id === this.chatId
        ) {
          this.generatingResponse = false;
          this.form.get('message')?.enable();
        }
      });
    } catch (error) {
      this.errorMessage = this.translateService.instant('COMMON.ERROR');
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
        func: 'send_message',
        message: message,
        id: this.chatId,
      });

      this.messages = response.messages;
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
        func: 'stop_generating_response',
        chat_id: this.chatId,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
