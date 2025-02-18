import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export type SelectOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-select',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './select.component.html',
})
export class SelectComponent {
  @Input()
  label: string = '';

  @Input()
  id?: string = '';

  @Input()
  control: FormControl = new FormControl('');

  @Input()
  options: SelectOption[] = [];
}
