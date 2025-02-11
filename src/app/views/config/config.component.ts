import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styles: [':host { width: 100%; }'],
  imports: [ButtonModule, TranslateModule, TagModule, CommonModule],
})
export class ConfigComponent implements OnInit {
  public electronTest?: boolean;
  public modelLoaded?: boolean | null;
  public modelName?: string;

  async ngOnInit() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'state',
      });

      this.electronTest = true;
      if (response.modelPath) {
        this.modelLoaded = true;
        this.modelName = response.modelPath;
        if (this.modelName) {
          this.modelName = this.modelName.split('\\').pop() || '';
          this.modelName = this.modelName.split('/').pop() || '';
        }
      }
    } catch (error) {
      console.log(error);
      this.electronTest = false;
      this.modelLoaded = false;
    }
  }

  async testElectron() {
    try {
      await (window as any).electronAPI.runNodeCode({
        func: 'test',
      });
      this.electronTest = true;
    } catch (error) {
      console.log(error);
      this.electronTest = false;
    }
  }

  async selectModel() {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'select_model',
      });
      this.modelName = response.modelName;
      this.modelLoaded = true;
    } catch (error) {
      console.log(error);
      this.modelLoaded = false;
    }
  }
}
