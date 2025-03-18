import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { ButtonComponent } from 'src/app/components/ui/button/button.component';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styles: [':host { width: 100%; }'],
  imports: [TranslateModule, TagModule, CommonModule, ButtonComponent, FormsModule],
})
export class ConfigComponent implements OnInit {
  public electronTest?: boolean;
  public modelLoaded?: boolean | null;
  public modelName?: string;
  public isSelectingModel?: boolean;
  public config: string = `{
    "batchSize": null,
    "contextSize": 1024,
    "embedding": null,
    "f16Kv": null,
    "gpuLayers": 0,
    "logitsAll": null,
    "maxTokens": 1024,
    "prependBos": null,
    "seed": null,
    "temperature": null,
    "threads": null,
    "trimWhitespaceSuffix": null,
    "topK": null,
    "topP": null,
    "useMlock": null,
    "useMmap": null,
    "vocabOnly": null,
    "jsonSchema": null,
    "gbnf": null
}`;

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
    this.isSelectingModel = true;
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'selectModel',
        config: this.config,
      });
      this.modelName = response.modelName;
      this.modelLoaded = true;
    } catch (error) {
      console.log(error);
      this.modelLoaded = false;
    } finally {
      this.isSelectingModel = false;
    }
  }
}
