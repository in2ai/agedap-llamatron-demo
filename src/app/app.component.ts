import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { environment } from 'src/environments/environment';
import { ModalComponent } from './components/smart/modal/modal.component';
import { LayoutComponent } from './layout/layout.component';
import { I18nService } from './service/translate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  imports: [LayoutComponent, ToastModule, ConfirmDialogModule, ModalComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Agedap Llamatron';

  constructor(private i18nService: I18nService) {}

  ngOnInit() {
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);
  }

  ngOnDestroy() {
    this.i18nService.destroy();
  }
}
