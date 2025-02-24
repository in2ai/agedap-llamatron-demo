import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldComponent } from '../field/field.component';
import { FileSelectorComponent } from '../file-selector/file-selector.component';

@Component({
  selector: 'app-work-space-documents',
  templateUrl: './work-space-documents.component.html',
  imports: [CommonModule, ReactiveFormsModule, FieldComponent, FileSelectorComponent],
  styles: [':host { width: 100%; }'],
})
export class WorkSpaceDocumentsComponent {
  public selectedWorkSpaceType: string = '';

  @Input()
  formGroup!: FormGroup;

  @Input()
  set workSpaceType(workspaceType: string) {
    this.selectedWorkSpaceType = workspaceType;
    // switch (workspaceType) {
    //   case 'workOffers':
    //     this.initWorkOffersType();
    //     break;

    //   case 'miscellaneous':
    //     this.initMiscellaneousType();
    //     break;

    //   default:
    //     break;
    // }
  }

  initWorkOffersType() {
    this.formGroup = new FormGroup({
      cvZip: new FormControl(''),
      relayId: new FormControl(''),
    });
    console.log('INITIALIZED WORK OFFERS TYPE:', this.formGroup.value);
  }

  initMiscellaneousType() {
    this.formGroup = new FormGroup({
      document: new FormControl(''),
    });
    console.log('INITIALIZED MISCELLANEOUS TYPE', this.formGroup.value);
  }

  getControl(name: string) {
    return this.formGroup.get(name) as FormControl;
  }
}
