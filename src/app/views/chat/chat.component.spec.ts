import { CommonModule, DatePipe } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { ChatService } from 'src/app/service/chat.service';
import { ChatComponent } from './chat.component';

// Mock de ChatService
const mockChatService = {
  getChat: jasmine
    .createSpy('getChat')
    .and.returnValue(Promise.resolve({ id: '1', name: 'Test Chat' })),
};

// Mock de electronAPI

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: ChatService;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
        MarkdownModule.forRoot(),
        ButtonModule,
        CommonModule,
        ChatComponent,
      ],
      providers: [{ provide: ChatService, useValue: mockChatService }, DatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    (window as any).electronAPI = {
      runNodeCode: jasmine.createSpy('runNodeCode').and.callFake(({ func }: { func: string }) => {
        if (func === 'state') {
          return Promise.resolve({ modelPath: '/path/to/model' });
        }
        if (func === 'loadChat') {
          return Promise.resolve({ messages: [] });
        }
        return Promise.resolve();
      }),
      onPartialMessageResponse: jasmine
        .createSpy('onPartialMessageResponse')
        .and.callFake(() => {}),
      onNewExternalMessage: jasmine.createSpy('onNewExternalMessage').and.callFake(() => {}),
    };

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService);
    translateService = TestBed.inject(TranslateService);

    // Asignar un chatId de prueba
    component.chatId = '1';

    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar el chat al inicializar', fakeAsync(async () => {
    await component.ngOnInit();
    expect(chatService.getChat).toHaveBeenCalledWith('1');
    expect(component.chat).toEqual(jasmine.objectContaining({ id: '1', name: 'Test Chat' }));
  }));

  it('debería mostrar el mensaje de error si no hay modelo cargado', fakeAsync(async () => {
    // Sobreescribimos runNodeCode para que no haya modelPath
    (window as any).electronAPI.runNodeCode.and.callFake(({ func }: { func: string }) => {
      if (func === 'state') {
        return Promise.resolve({});
      }
      return Promise.resolve();
    });

    await component.checkModel();
    expect(component.errorMessage).toBe(translateService.instant('COMMON.MODEL_NOT_LOADED'));
  }));

  it('debería enviar un mensaje correctamente', fakeAsync(async () => {
    await component.ngOnInit();
    component.form.get('message')?.setValue('Hola mundo');
    fixture.detectChanges();
    component.chatRef = {
      nativeElement: {
        scrollTop: 0,
        scrollHeight: 1000,
      },
    } as any;
    await component.sendMessage();

    expect(component.messages.length).toBe(1);
    expect(component.messages[0]).toEqual(
      jasmine.objectContaining({
        type: 'user',
        message: 'Hola mundo',
      })
    );
  }));

  it('no debería enviar un mensaje vacío', fakeAsync(async () => {
    await component.ngOnInit();
    component.form.get('message')?.setValue('');
    fixture.detectChanges();

    await component.sendMessage();

    expect(component.messages.length).toBe(0);
  }));
});
