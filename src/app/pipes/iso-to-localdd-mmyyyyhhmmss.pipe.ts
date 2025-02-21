import { Pipe, PipeTransform } from '@angular/core';
import { isoStringToddMMYYYYhhmmss } from '../helpers/utils';

@Pipe({
  name: 'isoToLocalddMMYYYYhhmmss',
})
export class IsoToLocalddMMYYYYhhmmssPipe implements PipeTransform {
  transform(value: string): string {
    const formattedDate = isoStringToddMMYYYYhhmmss(value);
    return formattedDate;
  }
}
