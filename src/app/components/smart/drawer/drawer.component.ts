import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  imports: [NgClass],
})
export class DrawerComponent {
  @Input()
  isOpen = false;

  @Output()
  onClose = new EventEmitter<any>();
}
