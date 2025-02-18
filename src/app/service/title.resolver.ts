import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TitleResolver implements Resolve<string> {
  constructor(private translateService: TranslateService) {}

  resolve(route: any): Promise<string> {
    if (!route.data.titleKey) {
      return Promise.resolve(environment.appName);
    }

    return Promise.resolve(this.translateService.instant(route.data.titleKey));
  }
}
