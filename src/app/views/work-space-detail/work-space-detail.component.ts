import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { WorkSpace, workSpaceTypeEnum } from 'src/app/models';
import { DrawerComponent } from '../../components/smart/drawer/drawer.component';
import { WorkSpaceDocumentsComponent } from '../../components/smart/work-space-documents/work-space-documents.component';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-work-space-detail',
  templateUrl: './work-space-detail.component.html',
  styles: [':host { width: 100%; }'],
  imports: [ChatComponent, DrawerComponent, WorkSpaceDocumentsComponent],
})
export class WorkSpaceDetailComponent implements OnInit {
  showConfiguration = false;
  workSpace!: WorkSpace;
  public workSpaceDocumentsForm!: FormGroup;

  constructor() {}

  ngOnInit(): void {
    // Recover workspace from API
    this.workSpace = {
      id: '1',
      type: workSpaceTypeEnum.WORKOFFERS,
      name: 'Workspace 1',
      description: 'Description of Workspace 1',
      createdAt: '2021-01-01T00:00:00Z',
      updatedAt: '2021-01-01T00:00:00Z',
    };

    this.workSpaceDocumentsForm = new FormGroup({
      cvZip: new FormControl(''),
      urlRelay: new FormControl(''),
    });
  }

  onToggleConfiguration(): void {
    this.showConfiguration = !this.showConfiguration;
  }
}
