import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import esES from 'assets/i18n/es-ES.json';
import { Subscription } from 'rxjs';

const languageKey = 'language';

export function extract(s: string) {
  return s;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  defaultLanguage!: string;

  supportedLanguages!: string[];

  private langChangeSubscription!: Subscription;

  constructor(private translateService: TranslateService) {
    translateService.setTranslation('es-ES', esES);
    registerLocaleData(localeEs, 'es-ES');
    registerLocaleData(localeEn, 'en-US');
  }

  init(defaultLanguage: string, supportedLanguages: string[]) {
    const languageLocalStorage = localStorage.getItem('language');
    this.defaultLanguage = defaultLanguage;
    if (languageLocalStorage) {
      this.defaultLanguage = languageLocalStorage;
    }
    this.supportedLanguages = supportedLanguages;
    this.language = '';

    this.langChangeSubscription = this.translateService.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        localStorage.setItem(languageKey, event.lang);
      }
    );
  }

  destroy() {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  set language(language: string) {
    let isSupportedLanguage = this.supportedLanguages.includes(language);

    if (language && !isSupportedLanguage) {
      language = language.split('-')[0];
      language =
        this.supportedLanguages.find((supportedLanguage) =>
          supportedLanguage.startsWith(language)
        ) || '';
      isSupportedLanguage = Boolean(language);
    }

    if (!isSupportedLanguage) {
      language = this.defaultLanguage;
    }

    this.translateService.use(language);
  }

  get language(): string {
    return this.translateService.currentLang;
  }
}
