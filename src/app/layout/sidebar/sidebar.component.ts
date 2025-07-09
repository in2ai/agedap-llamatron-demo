import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NavLinkComponent } from 'src/app/components/ui/nav-link/nav-link.component';
import { MainRouteInfo, RouteInfo } from 'src/app/models';
import { AppService } from 'src/app/service/app.service';
import { environment } from 'src/environments/environment';
import { APP_ROUTES, CONFIG_ROUTE } from './sidebar.routes';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: [],
  imports: [CommonModule, TranslateModule, RouterLink, NavLinkComponent, ConfirmDialog],
  providers: [ConfirmationService],
})
export class SidebarComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private appService: AppService,
    private confirmationService: ConfirmationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public sidebarCollapsed = false;
  public sidebarVisible = true;
  public mainRoutes: MainRouteInfo[] = APP_ROUTES;
  public configRoute: RouteInfo = CONFIG_ROUTE;
  public appName: string = environment.appName;
  public modelLoaded: boolean = false;
  private appDataSubscription: any;
  public chats: any[] = [];
  public currentChatId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.appDataSubscription = this.appService.watchData().subscribe((data) => {
      if (typeof data.modelLoaded === 'boolean') {
        this.modelLoaded = data.modelLoaded;
      } else if (data.newChat) {
        this.chats.unshift(data.newChat); // Add new chat to the beginning of the list
        this.currentChatId = data.newChat.id; // Set current chat ID to the new chat
      }
    });

    this.loadChats();

    // chat/:id route
    this.router.events.subscribe((event: any) => {
      if (event && event.url) {
        if (event.url.startsWith('/chat/')) {
          const nextSlashIndex = event.url.indexOf('/', 6);
          if (nextSlashIndex !== -1) {
            this.currentChatId = event.url.substring(6, nextSlashIndex); // Extract chat ID from URL
          } else {
            this.currentChatId = event.url.substring(6); // Extract chat ID if no next slash
          }
        } else {
          this.currentChatId = null; // Reset if the URL does not match chat route
        }
      }
    });

    this.listenBackgroundChatUpdates();
  }

  async listenBackgroundChatUpdates() {
    console.log('Listening for background chat updates...');
    (window as any).electronAPI.onBackgroundChatUpdated(async (event: any, data: any) => {
      if (data.func === 'onBackgroundChatUpdated') {
        await this.loadChats();
        this.changeDetectorRef.detectChanges(); // Ensure the view updates with new chat data
      }
    });

    (window as any).electronAPI.onNotificationClicked(async (event: any, data: any) => {
      console.log('Notification clicked:', data);
      if (data.func === 'onNotificationClicked' && data.type && data.type === 'chat') {
        const chatId = data.chatId;
        //check if chatId is valid
        if (chatId && this.chats.some((chat) => chat.id === chatId)) {
          this.router.navigate(['/chat', chatId]);
        } else {
          console.error('Invalid chat ID:', chatId);
        }
      }
    });
  }

  async loadChats() {
    const response = await (window as any).electronAPI.runNodeCode({
      func: 'getChats',
    });

    if (response && response.chats) {
      this.chats = response.chats.reverse(); // Reverse to show the latest chats first
    }
    console.log('Chats loaded:', this.chats);
  }

  ngOnDestroy(): void {
    this.appDataSubscription.unsubscribe();
  }

  isMainRouteActive(route: MainRouteInfo) {
    return this.router.url.startsWith(route.path);
  }

  isRouteActive(route: RouteInfo) {
    let checkFullPath = route.path;
    if (route.params) {
      checkFullPath += '?';
      for (const key in route.params) {
        if (route.params.hasOwnProperty(key)) {
          checkFullPath += key + '=' + route.params[key] + '&';
        }
      }
      checkFullPath = checkFullPath.slice(0, -1);
    }

    return this.router.url.startsWith(checkFullPath);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  topggleSidebarCollapse() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  selectChat(chat: any) {
    this.router.navigate(['/chat', chat.id]);
  }

  deleteChat(chat: any) {
    this.confirmationService.confirm({
      header: 'Eliminar conversación',
      icon: 'pi pi-trash',
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      message: `¿Estás seguro de que quieres eliminar la conversación "${chat.name}"?`,
      accept: async () => {
        const response = await (window as any).electronAPI.runNodeCode({
          func: 'deleteChat',
          chatId: chat.id,
        });

        if (response) {
          if (this.currentChatId === chat.id) {
            this.router.navigate(['/config']); // Navigate to config if the deleted chat was the current one
          }
          this.chats = this.chats.filter((c) => c.id !== chat.id);
          console.log('Chat deleted:', chat.id);
        } else {
          console.error('Error deleting chat:', response);
        }
      },
    });
  }

  newChat() {
    this.router.navigate(['/config']);
  }

  getChatIcon(chat: any): string {
    switch (chat.type) {
      case 'online':
        return 'pi-comments';
      case 'plugin':
        return 'pi-bolt';
      default:
        return 'pi-microchip-ai'; // Default icon if no specific icon is set
    }
  }
}
