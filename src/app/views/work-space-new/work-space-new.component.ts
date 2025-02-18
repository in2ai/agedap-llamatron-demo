import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FieldComponent } from 'src/app/components/smart/field/field.component';
import { SelectComponent, SelectOption } from 'src/app/components/smart/select/select.component';
import { TextareaComponent } from 'src/app/components/smart/textarea/textarea.component';
import { ButtonComponent } from 'src/app/components/ui/button/button.component';
import { WorkSpaceDocumentsComponent } from '../../components/smart/work-space-documents/work-space-documents.component';

@Component({
  selector: 'app-work-space-new',
  templateUrl: './work-space-new.component.html',
  styles: [':host { width: 100%; }'],
  imports: [
    CommonModule,
    FieldComponent,
    ButtonComponent,
    TranslateModule,
    SelectComponent,
    TextareaComponent,
    JsonPipe,
    WorkSpaceDocumentsComponent,
  ],
})
export class WorkSpaceNewComponent implements OnInit {
  router = inject(Router);

  public workSpaceForm!: FormGroup;
  public workSpaceDocumentsForm!: FormGroup;
  public workSpaceTypes: SelectOption[] = [];

  constructor() {}

  ngOnInit() {
    // Recover workspace types
    this.workSpaceTypes = [
      { value: 'workOffers', label: 'Work offers' },
      { value: 'miscellaneous', label: 'Miscellaneous' },
    ];

    this.workSpaceForm = new FormGroup({
      name: new FormControl(''),
      description: new FormControl(''),
      type: new FormControl('workOffers'),
    });

    this.workSpaceDocumentsForm = new FormGroup({
      cvZip: new FormControl(''),
      urlRelay: new FormControl(''),
    });
  }

  getWorkSpaceControl(name: string) {
    return this.workSpaceForm.get(name) as FormControl;
  }

  saveWorkSpace() {
    // TODO: API create new workspace and when id retreived navigate to /workspace/:id
    console.log('SAVE NEW WORKSPACE');
    this.router.navigate(['/workspace/1']);
  }
}
