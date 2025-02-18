import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './textarea.component.html',
})
export class TextareaComponent {
  @Input()
  label: string = '';

  @Input()
  cols?: string = '';

  @Input()
  rows?: string = '';

  @Input()
  id?: string = '';

  @Input()
  placeholder?: string;

  @Input()
  type?: string = 'text';

  @Input()
  control: FormControl = new FormControl('');
}
