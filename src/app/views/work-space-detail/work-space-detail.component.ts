import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { WorkSpaceDeleteRendererComponent } from 'src/app/components/aggrid/work-space-delete-renderer/work-space-delete-renderer.component';
import { isoStringToddMMYYYYhhmmss } from 'src/app/helpers/utils';
import { Chat, WorkSpace } from 'src/app/models';
import { IsoToLocalddMMYYYYhhmmssPipe } from 'src/app/pipes/iso-to-localdd-mmyyyyhhmmss.pipe';
import { WorkSpaceService } from 'src/app/service/work-space.service';
import { DrawerComponent } from '../../components/smart/drawer/drawer.component';
import { WorkSpaceDocumentsComponent } from '../../components/smart/work-space-documents/work-space-documents.component';
import { ChatComponent } from '../chat/chat.component';

// AG-Grid
import { TranslateModule } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ChatService } from 'src/app/service/chat.service';
import { ModalService } from 'src/app/service/modal.service';
import { NewChatCreationComponent } from '../../components/smart/new-chat-creation/new-chat-creation.component';
import { ButtonComponent } from '../../components/ui/button/button.component';

ModuleRegistry.registerModules([AllCommunityModule]);

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
    AgGridAngular,
    ButtonComponent,
    TranslateModule,
    NewChatCreationComponent,
  ],
})
export class WorkSpaceDetailComponent implements OnInit {
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  workSpaceId = '';
  chatId = '';
  isNewChatCreationVisible = false;

  workSpace!: WorkSpace;
  chats!: Chat[];

  constructor(
    private workSpaceService: WorkSpaceService,
    private chatService: ChatService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.workSpaceId = this.activatedRoute.snapshot.params['workSpaceId'] ?? '';
    this.chatId = this.activatedRoute.snapshot.params['chatId'] ?? '';
    this.recoverWorkSpace();
  }

  async recoverWorkSpace() {
    if (!this.workSpaceId) return;

    try {
      this.workSpace = await this.workSpaceService.getWorkSpace(this.workSpaceId);
      this.recoverChats();
    } catch (error) {
      console.log(error);
    }
  }

  // Table configutation
  public workSpaces: WorkSpace[] = [];
  public colDefs: ColDef<Chat>[] = [
    { field: 'name', headerName: 'Nombre' },
    { field: 'description', headerName: 'Descripción' },
    {
      field: 'createdAt',
      headerName: 'Creado el',
      valueFormatter: (params) => isoStringToddMMYYYYhhmmss(params.value),
    },
    {
      field: 'updatedAt',
      headerName: 'Actualizado el',
      valueFormatter: (params) => isoStringToddMMYYYYhhmmss(params.value),
    },
    {
      colId: 'removeAction',
      field: 'id',
      headerName: 'Eliminar',
      pinned: 'right',
      width: 100,
      cellRenderer: WorkSpaceDeleteRendererComponent,
    },
  ];
  public defaultColDef: ColDef = {
    flex: 1,
  };

  onCellClicked = (event: CellClickedEvent) => {
    const chatSelected = event.data;

    if (event.colDef.colId === 'removeAction') {
      return this.removeChat(chatSelected);
    }

    return this.router.navigate([`/workspace/${this.workSpaceId}/chat/${chatSelected.id}`]);
  };

  // WorkSpace component methods
  async createNewChat(chat: Chat) {
    this.hideNewChatCreation();
    try {
      await this.chatService.createChat(chat);
      // TODO: navigate to chat
      this.recoverChats();
    } catch (error) {
      console.log(error);
    }
  }

  async recoverChats() {
    if (!this.workSpaceId) return;
    try {
      this.chats = await this.chatService.getChats(this.workSpaceId);
    } catch (error) {
      console.log(error);
    }
  }

  removeChat(chat: Chat) {
    this.modalService
      .confirmModal('Eliminar chat', `¿Está seguro de querer eliminar el chat "${chat.name}"?`)
      .then((result) => {
        if (result) {
          if (chat.id) this.deleteChat(chat.id);
        }
      });
  }

  async deleteChat(chatId: string) {
    try {
      await this.chatService.deleteChat(chatId);
      this.recoverChats();
    } catch (error) {
      console.log(error);
    }
  }

  showNewChatCreation(): void {
    this.isNewChatCreationVisible = true;
  }

  hideNewChatCreation(): void {
    this.isNewChatCreationVisible = false;
  }

  // Configuration Drawer
  // TODO: temporarily non configurable
  showConfiguration = false;
  workSpaceDocumentsForm: FormGroup = new FormGroup({
    cvZip: new FormControl(''),
    relayId: new FormControl(''),
  });
  onToggleConfiguration(): void {
    this.showConfiguration = !this.showConfiguration;
  }
}
