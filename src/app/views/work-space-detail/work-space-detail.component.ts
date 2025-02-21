import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WorkSpace } from 'src/app/models';
import { IsoToLocalddMMYYYYhhmmssPipe } from 'src/app/pipes/iso-to-localdd-mmyyyyhhmmss.pipe';
import { WorkSpaceService } from 'src/app/service/work-space.service';
import { DrawerComponent } from '../../components/smart/drawer/drawer.component';
import { WorkSpaceDocumentsComponent } from '../../components/smart/work-space-documents/work-space-documents.component';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-work-space-detail',
  templateUrl: './work-space-detail.component.html',
  styles: [':host { width: 100%; }'],
  imports: [
    ChatComponent,
    DrawerComponent,
    WorkSpaceDocumentsComponent,
    IsoToLocalddMMYYYYhhmmssPipe,
    CommonModule,
  ],
})
export class WorkSpaceDetailComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);

  showConfiguration = false;
  selectedChatId = '';
  workSpace!: WorkSpace;
  public workSpaceDocumentsForm!: FormGroup;

  constructor(private workSpaceService: WorkSpaceService) {}

  ngOnInit(): void {
    const workSpaceId = this.activatedRoute.snapshot.params['id'] ?? '';
    if (workSpaceId) {
      this.recoverWorkSpace(workSpaceId);
    }

    this.workSpaceDocumentsForm = new FormGroup({
      cvZip: new FormControl(''),
      urlRelay: new FormControl(''),
    });
  }

  async recoverWorkSpace(workSpaceId: string) {
    try {
      this.workSpace = await this.workSpaceService.getWorkSpace(workSpaceId);
    } catch (error) {
      console.log(error);
    }
  }

  onToggleConfiguration(): void {
    this.showConfiguration = !this.showConfiguration;
  }
}
