import { Routes } from '@angular/router';
import { TitleResolver } from './service/title.resolver';
import { ChatComponent } from './views/chat/chat.component';
import { ConfigComponent } from './views/config/config.component';
import { PageNotFoundComponent } from './views/page-not-found/page-not-found.component';
import { WorkSpaceDetailComponent } from './views/work-space-detail/work-space-detail.component';
import { WorkSpaceNewComponent } from './views/work-space-new/work-space-new.component';
import { WorkSpaceComponent } from './views/work-space/work-space.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'config',
  },
  {
    path: 'config',
    component: ConfigComponent,
  },
  {
    path: 'workspace',
    component: WorkSpaceComponent,
  },
  {
    path: 'workspace/new',
    component: WorkSpaceNewComponent,
  },
  {
    path: 'workspace/:workSpaceId',
    component: WorkSpaceDetailComponent,
  },
  {
    path: 'workspace/:workSpaceId/chat/:chatId',
    component: ChatComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    title: TitleResolver,
    data: { titleKey: '404.TITLE' },
  },
];
