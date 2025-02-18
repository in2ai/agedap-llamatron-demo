import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldComponent } from '../field/field.component';

@Component({
  selector: 'app-work-space-documents',
  templateUrl: './work-space-documents.component.html',
  imports: [CommonModule, ReactiveFormsModule, FieldComponent],
  styles: [':host { width: 100%; }'],
})
export class WorkSpaceDocumentsComponent {
  public selectedWorkSpaceType: string = '';

  @Input()
  formGroup!: FormGroup;

  @Input()
  set workSpaceType(workspaceType: string) {
    console.log('SET WORKSPACE TYPE', workspaceType);
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
      urlRelay: new FormControl(''),
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
    console.log('GET CONTROL', name);
    console.log('FORM GROUP', this.formGroup.value);
    return this.formGroup.get(name) as FormControl;
  }
}
