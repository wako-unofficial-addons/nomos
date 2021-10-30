import { Injectable } from '@angular/core';
import {
  Episode,
  ExplorerFile,
  ExplorerFolderItem,
  KodiOpenParams,
  Movie,
  OpenMedia,
  PluginBaseService,
  Show,
  WakoFileActionButton
} from '@wako-app/mobile-sdk';
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

  customAction(action: string, data: any): any {}

  afterEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode> {
    return Promise.resolve(undefined);
  }

  afterMovieMiddleware(movie: Movie): Promise<Movie> {
    return Promise.resolve(undefined);
  }

  afterShowMiddleware(show: Show): Promise<Show> {
    return Promise.resolve(undefined);
  }

  beforeEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode> {
    return Promise.resolve(undefined);
  }

  beforeMovieMiddleware(movie: Movie): Promise<Movie> {
    return Promise.resolve(undefined);
  }

  beforeShowMiddleware(show: Show): Promise<Show> {
    return Promise.resolve(undefined);
  }

  fetchExplorerFolderItem(): Promise<ExplorerFolderItem | ExplorerFolderItem[]> {
    throw new Error('Method not implemented.');
  }
  getFileActionButtons(
    file: ExplorerFile,
    title?: string,
    posterUrl?: string,
    seekTo?: number,
    openMedia?: OpenMedia,
    kodiOpenParams?: KodiOpenParams
  ): Promise<WakoFileActionButton[]> {
    throw new Error('Method not implemented.');
  }
}
