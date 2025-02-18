import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'boolean_data',
})
export class BooleanDataPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(value: boolean): string {
    if (value) {
      return this.translateService.instant('COMMON.YES');
    }
    return this.translateService.instant('COMMON.NO');
  }
}
