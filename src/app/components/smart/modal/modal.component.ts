import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Modal, ModalService } from 'src/app/service/modal.service';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styles: [
    ':host { width: 100%; height: 100%; position: fixed; z-index:9999; top:0; left:0; pointer-events: none; }',
  ],
  imports: [ButtonComponent, TranslateModule, CommonModule],
})
export class ModalComponent {
  modal: Modal = {
    isModalVisible: false,
    title: '',
    message: '',
  };

  constructor(private modalService: ModalService) {
    this.modalService.modal$.subscribe((modal) => (this.modal = modal));
  }

  onConfirmHandler() {
    this.modalService.onConfirmHandler();
  }

  onCancelHandler() {
    this.modalService.onCancelHandler();
  }
}
