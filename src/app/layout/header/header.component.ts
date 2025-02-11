import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { APP_ROUTES, MainRouteInfo } from '../sidebar/sidebar.routes';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: [],
  imports: [CommonModule, TranslateModule],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar: EventEmitter<void> = new EventEmitter<void>();
  public title: string = '';
  public icon: string = '';

  private sidebarRoutes: MainRouteInfo[] = APP_ROUTES;
  public tabs: MenuItem[] = [];
  public activeTab: MenuItem | undefined = undefined;

  private subscriptions: any[] = [];
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.title = document.title;
    this.subscriptions = [
      this.router.events.subscribe(() => {
        this.title = document.title;

        const currentRoute = this.router.url;
        const mainRoute = this.sidebarRoutes.find((route) => currentRoute.includes(route.path));
        console.log('mainRoute', mainRoute);

        if (mainRoute && mainRoute.routes && mainRoute.routes.length > 0) {
          this.tabs = mainRoute.routes.map((route) => {
            return {
              label: this.translateService.instant(route.title),
              icon: route.icon,
              routerLink: route.path,
            };
          });

          this.activeTab = this.tabs.find((tab) => currentRoute.includes(tab.routerLink));
          console.log('activeTab', this.activeTab);
          this.icon = this.activeTab?.icon || 'pi pi-home';
        } else {
          this.activeTab = undefined;
          this.tabs = [];
        }
      }),
    ];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  toggleSidebarButton() {
    if (this.toggleSidebar) {
      this.toggleSidebar.emit();
    }
  }
}
