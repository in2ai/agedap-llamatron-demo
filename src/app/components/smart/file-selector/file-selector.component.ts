import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-file-selector',
  imports: [ReactiveFormsModule, ButtonComponent, CommonModule],
  templateUrl: './file-selector.component.html',
})
export class FileSelectorComponent {
  public fileName?: string = '';
  public filePath?: string;

  @ViewChild('fileInput') fileInputRef?: ElementRef;

  @Input()
  label: string = '';

  @Input()
  placeholder?: string;

  @Input()
  control: FormControl = new FormControl('');

  async onClickFileSelector() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'select_zip_file',
      });
      this.fileName = response.fileName;
      this.filePath = response.filePath;
      this.control.setValue(this.filePath);
    } catch (error) {
      console.log(error);
    }
  }
}
