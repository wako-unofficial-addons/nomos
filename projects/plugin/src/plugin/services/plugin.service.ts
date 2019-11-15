import { Injectable } from '@angular/core';
import { PluginBaseService } from '@wako-app/mobile-sdk';
import { TranslateService } from '@ngx-translate/core';
import { KodiPluginService } from './kodi-plugin.service';
import { logData } from './tools';

@Injectable()
export class PluginService extends PluginBaseService {
  constructor(protected translate: TranslateService, private kodiPluginService: KodiPluginService) {
    super();
  }

  initialize() {
    logData('plugin initialized');

    setTimeout(() => {
      this.kodiPluginService.refreshPlugins();
    }, 10000);

    this.kodiPluginService.patchStorageKey();
  }

  afterInstall() {
    logData('plugin installed');
  }

  setTranslation(lang: string, translations: any): any {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    this.translate.setTranslation(lang, translations);
  }
}
