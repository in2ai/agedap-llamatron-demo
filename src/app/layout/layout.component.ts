import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  imports: [SidebarComponent, RouterOutlet],
  styleUrls: [],
})
export class LayoutComponent {
  @ViewChild('sidebar') sidebar: any;

  constructor() {}

  onToggleSidebar() {
    this.sidebar.toggleSidebar();
  }
}
