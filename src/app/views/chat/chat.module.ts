import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/@shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { ChatComponent } from './chat.component';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  imports: [SharedModule, InputTextModule, MarkdownModule],
  declarations: [ChatComponent],
  exports: [ChatComponent],
})
export class ChatModule {}
