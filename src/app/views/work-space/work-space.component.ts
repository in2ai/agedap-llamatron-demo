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
import { WorkSpaceService } from 'src/app/service/work-space.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-work-space',
  templateUrl: './work-space.component.html',
  styles: [':host { width: 100%; }'],
  imports: [CommonModule, ButtonComponent, TranslateModule, AgGridAngular],
})
export class WorkSpaceComponent implements OnInit {
  constructor(private workSpaceService: WorkSpaceService) {}

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
    try {
      this.workSpaces = await this.workSpaceService.getWorkSpaces();
    } catch (error) {
      console.log(error);
    }
  }

  createNewWorkSpace() {
    this.router.navigate(['/workspace/new']);
  }
}
