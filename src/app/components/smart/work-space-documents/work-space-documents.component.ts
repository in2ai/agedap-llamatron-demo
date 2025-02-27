import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Relay } from 'src/app/models';
import { RelayService } from 'src/app/service/relay.service';
import { FileSelectorComponent } from '../file-selector/file-selector.component';
import { SelectComponent, SelectOption } from '../select/select.component';

@Component({
  selector: 'app-work-space-documents',
  templateUrl: './work-space-documents.component.html',
  imports: [CommonModule, ReactiveFormsModule, FileSelectorComponent, SelectComponent],
  styles: [':host { width: 100%; }'],
})
export class WorkSpaceDocumentsComponent implements OnInit {
  selectedWorkSpaceType: string = '';
  availableRelays: Relay[] = [];
  availableRelaysOptions: SelectOption[] = [];

  @Input()
  formGroup!: FormGroup;

  @Input()
  set workSpaceType(workspaceType: string) {
    this.selectedWorkSpaceType = workspaceType;
  }

  constructor(private relayService: RelayService) {}

  ngOnInit(): void {
    this.recoverRelays();
  }

  async recoverRelays() {
    try {
      this.availableRelays = await this.relayService.getRelays();
      this.availableRelaysOptions = this.availableRelays.map((relay) => {
        return { value: relay.id, label: relay.name };
      });
    } catch (error) {
      console.log(error);
    }
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
