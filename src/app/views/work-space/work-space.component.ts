import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'src/app/components/ui/button/button.component';
import { WorkSpace } from 'src/app/models';

import { AgGridAngular } from 'ag-grid-angular';
import type { CellClickedEvent, ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { WorkSpaceTypeRendererComponent } from 'src/app/components/aggrid/work-space-type-renderer/work-space-type-renderer.component';
import { isoStringToddMMYYYYhhmmss } from 'src/app/helpers/utils';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-work-space',
  templateUrl: './work-space.component.html',
  styles: [':host { width: 100%; }'],
  imports: [CommonModule, ButtonComponent, TranslateModule, AgGridAngular],
})
export class WorkSpaceComponent implements OnInit {
  router = inject(Router);

  // TODO: Implement ferching save workspaces
  // public workSpaces: WorkSpace[] = [];
  public workSpaces: WorkSpace[] = [];
  public colDefs: ColDef<WorkSpace>[] = [
    {
      field: 'type',
      headerName: 'Tipo',
      cellRenderer: WorkSpaceTypeRendererComponent,
    },
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
    { field: 'numChats', headerName: 'Nº Chats' },
  ];
  public defaultColDef: ColDef = {
    flex: 1,
  };

  onCellClicked = (event: CellClickedEvent) => {
    this.router.navigate(['/workspace', event.data.id]);
  };

  ngOnInit() {
    this.recoverWorkSpaces();
  }

  async recoverWorkSpaces() {
    // TODO: Move workspàces queries to service
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getWorkspaces',
        page: 0,
        limit: 10,
      });
      console.log('//RECOVERED WORKSPACES: ', response);
      this.workSpaces = response.workspaces;
    } catch (error) {
      console.log(error);
    }

    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getWorkspace',
        workspaceId: '27f8d11b-fb0e-44f8-919e-1c632264695e',
      });
      console.log('//RECOVERED WORKSPACE: ', response);
      this.workSpaces = response.workspaces;
    } catch (error) {
      console.log(error);
    }
  }

  createNewWorkSpace() {
    this.router.navigate(['/workspace/new']);
  }
}
