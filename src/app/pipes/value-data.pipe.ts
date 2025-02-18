import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'value_data',
})
export class ValueDataPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(value: string): string {
    if (value && value.length > 0) {
      return value;
    }
    return this.translateService.instant('COMMON.NULL');
  }
}
