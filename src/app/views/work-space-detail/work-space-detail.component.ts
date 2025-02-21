import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
  activatedRoute = inject(ActivatedRoute);

  workSpaceId = '';
  selectedChatId = '';
  isNewChatCreationVisible = false;

  workSpace!: WorkSpace;
  chats!: Chat[];

  constructor(
    private workSpaceService: WorkSpaceService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.workSpaceId = this.activatedRoute.snapshot.params['id'] ?? '';
    this.recoverWorkSpace();
  }

  async recoverWorkSpace() {
    console.log('RECOVER CHATS FOR WORKSPACE: ', this.workSpaceId);
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
    const rowSelected = event.data;

    if (event.colDef.colId === 'removeAction') {
      const chatId = rowSelected.id;
      this.removeChat(chatId);
    }
  };

  // WorkSpace component methods
  async createNewChat(chat: Chat) {
    console.log('create new chat: ', chat);
    this.hideNewChatCreation();
    try {
      const newChat = await this.chatService.createChat(chat);
      // TODO: navigate to chat
      console.log('new chat created: ', newChat);
      this.recoverChats();
    } catch (error) {
      console.log(error);
    }
  }

  async recoverChats() {
    console.log('//1 recover chats | WORKSPACE: ', this.workSpaceId);
    if (!this.workSpaceId) return;
    try {
      console.log('//2 try recovering chats');
      this.chats = await this.chatService.getChats(this.workSpaceId);
      console.log('//4 chats recovered: ', this.chats);
    } catch (error) {
      console.log(error);
    }
  }

  async removeChat(chatId: string) {
    try {
      const id = await this.chatService.deleteChat(chatId);
      console.log('chat removed: ', id);
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
    urlRelay: new FormControl(''),
  });
  onToggleConfiguration(): void {
    this.showConfiguration = !this.showConfiguration;
  }
}
