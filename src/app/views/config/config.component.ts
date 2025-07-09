import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { getGPUTier } from 'detect-gpu';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from 'src/app/components/ui/button/button.component';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styles: [':host { width: 100%; }'],
  imports: [
    TranslateModule,
    Toast,
    TagModule,
    CommonModule,
    ButtonComponent,
    FormsModule,
    ProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  providers: [MessageService],
})
export class ConfigComponent implements OnInit {
  @ViewChild('chatInputField') chatInputField: any;
  public electronTest?: boolean;
  public modelLoaded?: boolean | null;
  public isRemoteModel: boolean = false;
  public modelName?: string;
  public isSelectingModel?: boolean;
  public config: string = `{
    "batchSize": 128,
    "contextSize": 4096,
    "gpuLayers": 1,
    "maxTokens": 2048,
    "temperature": 0.7,
    "threads": 4,
    "topK": 40,
    "topP": 0.4
}`;
  public appConfig: any = null;
  public gpuTier: number = 0;
  public togetherApiKey: string = '';
  public minTier: number = 4;
  public loading: boolean = true;
  public form!: FormGroup;

  public exampleButtons = [
    {
      title: 'Ayúdame a encontrar trabajo',
      type: 'plugin',
      value: 'workOffers',
    },
    {
      title: 'Obtener consejos',
      type: 'text',
      value: 'Dame consejos sobre ',
    },
    {
      title: 'Aprender algo nuevo',
      type: 'text',
      value: 'Enseñame sobre ',
    },
    {
      title: 'Crear un plan',
      type: 'text',
      value: 'Ayúdame a crear un plan para ',
    },
    {
      title: 'Lluvia de ideas',
      type: 'text',
      value: 'Ayúdame a hacer una lluvia de ideas sobre ',
    },
    {
      title: 'Practicar un idioma',
      type: 'text',
      value: 'Ayúdame a practicar la conversación en ',
    },
  ];

  constructor(
    private messageService: MessageService,
    private appService: AppService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      this.form = this.fb.group({
        message: [''],
      });
      this.loading = true;
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'loadApp',
      });

      const gpuTier = await getGPUTier();
      this.gpuTier = gpuTier.tier || 0;

      this.electronTest = true;
      if (response && response.modelPath) {
        this.modelLoaded = true;
        this.isRemoteModel = response.configuration.togetherAI || false;
        this.modelName = response.modelPath;
        this.appService.sendData({
          modelName: this.modelName,
          modelLoaded: this.modelLoaded,
        });
        if (this.modelName) {
          this.modelName = this.modelName.split('\\').pop() || '';
          this.modelName = this.modelName.split('/').pop() || '';
        }
      }

      console.log('GPU Tier:', this.gpuTier);
      if (this.gpuTier < this.minTier && !this.modelLoaded) {
        console.warn(`Low GPU Tier: ${this.gpuTier}`);
        this.messageService.add({
          severity: 'warn',
          summary: 'Memoria de GPU baja',
          detail: `Te recomendamos usar un modelo en remoto, tu equipo puede no tener suficiente memoria de GPU para ejecutar modelo en local.`,
          life: 10000,
        });
      }

      this.appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
      this.appConfig = this.appConfig.config;
      if (!this.appConfig || !this.appConfig.secretKey) {
        await (window as any).electronAPI.runNodeCode({ func: 'genSecretKey' });
        this.appConfig = await (window as any).electronAPI.runNodeCode({ func: 'getConfig' });
      }
      console.log('Config loaded:', this.appConfig);
    } catch (error) {
      console.log(error);
      this.electronTest = false;
      this.modelLoaded = false;
    } finally {
      this.loading = false;
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
      this.isRemoteModel = false;
      this.appService.sendData({
        modelName: this.modelName,
        modelLoaded: this.modelLoaded,
      });
    } catch (error) {
      console.log(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al cargar el modelo',
        detail: 'No se pudo cargar el modelo. Asegúrate de que el modelo existe y es compatible.',
        life: 5000,
      });
      this.modelLoaded = false;
      this.isRemoteModel = false;
      this.appService.sendData({
        modelName: undefined,
        modelLoaded: false,
      });
    } finally {
      this.isSelectingModel = false;
    }
  }

  async loadRemoteModel() {
    try {
      if (!this.togetherApiKey || this.togetherApiKey.trim() === '') {
        this.messageService.add({
          severity: 'error',
          summary: 'Clave API requerida',
          detail: 'Por favor, introduce tu clave API de Together AI.',
        });
        return;
      }
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'selectModel',
        config: JSON.stringify({
          togetherAI: true,
          togetherApiKey: this.togetherApiKey,
        }),
      });
      this.modelName = response.modelName;
      this.modelLoaded = true;
      this.isRemoteModel = true;
      this.appService.sendData({
        modelName: this.modelName,
        modelLoaded: this.modelLoaded,
      });
    } catch (error) {
      console.log(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al cargar el modelo remoto',
        detail: 'No se pudo cargar el modelo remoto. Asegúrate de que la clave API es correcta.',
        life: 5000,
      });
      this.modelLoaded = false;
      this.isRemoteModel = false;
      this.appService.sendData({
        modelName: undefined,
        modelLoaded: false,
      });
    }
  }

  async resetModel() {
    await (window as any).electronAPI.runNodeCode({
      func: 'unloadModel',
    });
    this.modelLoaded = false;
    this.modelName = undefined;
    this.isSelectingModel = false;
    this.togetherApiKey = '';
    this.form.reset();
    this.appService.sendData({
      modelName: undefined,
      modelLoaded: false,
    });
  }

  onExampleButtonClick(button: any) {
    if (button.type === 'plugin') {
      this.router.navigate(['/chat', 'new'], {
        queryParams: {
          type: 'plugin',
          value: button.value,
        },
      });
    } else if (button.type === 'text') {
      this.form.get('message')?.setValue(button.value);
      //focus the input field
      this.chatInputField.nativeElement.focus();
    }
  }

  sendMessage() {
    const message = this.form.get('message')?.value;
    if (message.length === 0) return;

    this.router.navigate(['/chat', 'new'], {
      queryParams: {
        type: 'text',
        message: message,
      },
    });
  }
}
