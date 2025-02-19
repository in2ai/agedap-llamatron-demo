import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { workSpaceTypeEnum } from 'src/app/models';

@Component({
  selector: 'app-work-space-type-renderer',
  templateUrl: './work-space-type-renderer.component.html',
  imports: [CommonModule],
})
export class WorkSpaceTypeRendererComponent implements ICellRendererAngularComp {
  value = signal('');
  parsedValue = signal('');

  icon: string = '';

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.value.set(params.value);
    this.parsedValue.set(params.value);
    this.icon = params.value === workSpaceTypeEnum.WORKOFFERS ? 'briefcase' : 'sparkles';
    return true;
  }
}
