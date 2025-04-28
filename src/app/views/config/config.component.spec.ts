import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ConfigComponent } from './config.component';

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({}); // Simula traducciones vacías
  }
}

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;

  beforeAll(() => {
    (window as any).electronAPI = {
      runNodeCode: (data: any) => {
        switch (data.func) {
          case 'test':
            return Promise.resolve({ func: data.func, result: 'Función test ejecutada' });
          case 'state':
            const state = {
              modelPath: 'C:\\path\\to\\model.bin',
              configuration: `{ "batchSize": 128, "contextSize": 4096, "gpuLayers": 1, "maxTokens": 2048, "temperature": 0.7, "threads": 4, "topK": 40, "topP": 0.4 }`,
            };
            return Promise.resolve({
              func: data.func,
              ...state,
            });
          case 'selectModel':
            const config = `{ "batchSize": 128, "contextSize": 4096, "gpuLayers": 1, "maxTokens": 2048, "temperature": 0.7, "threads": 4, "topK": 40, "topP": 0.4 }`;
            let configuration: any = undefined;
            if (config)
              configuration = JSON.parse(config, (key: any, value: any) =>
                value === null ? undefined : value
              );
            const loadModal = (configuration: any) => {
              console.log('Loading model with configuration:', configuration);
            };
            loadModal(configuration);
            return Promise.resolve({
              func: data.func,
              modelName: 'model.bin',
              modelPath: 'C:\\path\\to\\model.bin',
            });
        }
        return Promise.resolve({ func: data.func, result: 'fake result' });
      },
      onPartialMessageResponse: () => {},
      onNewExternalMessage: () => {},
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConfigComponent, // Importa el componente standalone
        CommonModule, // Necesario para directivas como *ngIf, *ngFor
        ReactiveFormsModule, // Necesario para los formularios
        TranslateModule.forRoot({
          // Configura ngx-translate en pruebas
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [TranslateService], // Proveemos TranslateService manualmente
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await component.ngOnInit();
    expect(component.electronTest).toBeTrue();
    console.log('electronTest:', component.electronTest);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call selectModel and update modelName and modelLoaded', async () => {
    await component.selectModel();
    fixture.detectChanges();

    console.log('Model name:', component.modelName);
    console.log('Model loaded:', component.modelLoaded);
    console.log('Is selecting model:', component.isSelectingModel);

    expect(component.modelName).toBe('model.bin');
    expect(component.modelLoaded).toBeTrue();
    expect(component.isSelectingModel).toBeFalse();
  });
});
