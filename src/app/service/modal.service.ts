import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Modal {
  isModalVisible: boolean;
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modal: Modal = {
    isModalVisible: false,
    title: '',
    message: '',
  };
  private modalSubject = new BehaviorSubject<Modal>({ ...this.modal });
  modal$ = this.modalSubject.asObservable();

  private isAccepted = false;

  constructor() {}

  private showModal(title: string, message: string) {
    this.modal = {
      isModalVisible: true,
      title,
      message,
    };
    this.modalSubject.next({ ...this.modal });
  }

  confirmModal(title: string, message: string): Promise<boolean> {
    this.showModal(title, message);
    return new Promise((resolve) => {
      this.modalSubject.subscribe((modal) => {
        if (!modal.isModalVisible) {
          resolve(this.isAccepted);
        }
      });
    });
  }

  onConfirmHandler() {
    this.isAccepted = true;
    this.modal.isModalVisible = false;
    this.modalSubject.next({ ...this.modal });
  }

  onCancelHandler() {
    this.isAccepted = false;
    this.modal.isModalVisible = false;
    this.modalSubject.next({ ...this.modal });
  }
}
