import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  escapeText,
  EventCategory,
  EventName,
  EventService,
  KodiApiService,
  KodiAppService,
  KodiGetAddonsForm,
  OpenMedia,
  replacer,
  WakoCacheService,
  WakoHttpRequestService,
  WakoStorage
} from '@wako-app/mobile-sdk';
import { from, NEVER, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { KodiOpenMedia } from '../entities/kodi-open-media';
import { KodiPlugin, KodiPluginList } from '../entities/kodi-plugin';
import { ToastService } from './toast.service';
import { logData } from './tools';

const CACHE_KEY_PLUGINS = 'CACHE_KEY_PLUGINS';
const CACHE_TIMEOUT_PLUGINS = '1d';

@Injectable()
export class KodiPluginService {
  constructor(
    private toastService: ToastService,
    private storage: WakoStorage,
    private actionSheetController: ActionSheetController,
    private translateService: TranslateService
  ) {}

  async patchStorageKey() {
    const url = await this.storage.get('kodi-plugins-url');
    if (url) {
      await this.storage.set(this.getStorageKeyPrefixed('kodi-plugins-url'), url);
      await this.storage.remove('kodi-plugins-url');
    }

    const list = await this.storage.get('kodi-plugins-list');
    if (list) {
      await this.storage.set(this.getStorageKeyPrefixed('kodi-plugins-list'), list);
      await this.storage.remove('kodi-plugins-list');
    }

    const open = await this.storage.get('openRemoteAfterClickOnPlay');
    if (open) {
      await this.storage.set(this.getStorageKeyPrefixed('openRemoteAfterClickOnPlay'), open);
      await this.storage.remove('openRemoteAfterClickOnPlay');
    }
  }

  private getStorageKeyPrefixed(key: string) {
    return `nomos_${key}`;
  }

  getPluginUrl(): Promise<string> {
    return this.storage.get(this.getStorageKeyPrefixed('kodi-plugins-url'));
  }

  private setPluginUrl(url: string): Promise<boolean> {
    return this.storage.set(this.getStorageKeyPrefixed('kodi-plugins-url'), url);
  }

  getPlugins(): Promise<KodiPluginList> {
    return this.storage.get(this.getStorageKeyPrefixed('kodi-plugins-list'));
  }

  setPlugins(plugins: KodiPluginList, isAutomatic = false) {
    return this.getPlugins().then((oldPlugins) => {
      if (oldPlugins && isAutomatic) {
        let areEquals = Object.keys(oldPlugins).length === Object.keys(plugins).length;

        if (areEquals) {
          Object.keys(oldPlugins).forEach((key) => {
            const _old = Object.assign({}, oldPlugins[key]);
            const _new = Object.assign({}, plugins[key]);
            _old.enabled = true;
            _new.enabled = true;
            if (JSON.stringify(_old) !== JSON.stringify(_new)) {
              areEquals = false;
            }
          });
        }

        if (!areEquals) {
          this.toastService.simpleMessage('toasts.pluginsUpdated');
        } else {
          logData('no changes in plugins');
        }

        Object.keys(oldPlugins).forEach((key) => {
          if (plugins.hasOwnProperty(key)) {
            plugins[key].enabled = oldPlugins[key].enabled;
          }
        });
      }
      return this.storage.set(this.getStorageKeyPrefixed('kodi-plugins-list'), plugins);
    });
  }

  setPluginsFromUrl(url: string, isAutomatic = false) {
    url = url.trim();

    return WakoHttpRequestService.request<KodiPluginList>(
      {
        url,
        method: 'GET'
      },
      null,
      10000,
      true
    ).pipe(
      switchMap((pluginList) => {
        if (typeof pluginList === 'string' || Object.keys(pluginList).length === 0) {
          return of(false);
        }

        if (!isAutomatic) {
          Object.keys(pluginList).forEach((key) => {
            pluginList[key].enabled = true;
          });
        }

        return from(this.setPlugins(pluginList, isAutomatic)).pipe(
          switchMap(() => {
            return from(this.setPluginUrl(url));
          }),
          map(() => {
            return true;
          })
        );
      }),
      catchError(() => {
        return of(false);
      })
    );
  }

  refreshPlugins() {
    WakoCacheService.get<boolean>(CACHE_KEY_PLUGINS).subscribe((cache) => {
      if (cache) {
        logData('check plugins later');
        return;
      }
      this.getPluginUrl().then((url) => {
        if (url) {
          this.setPluginsFromUrl(url, true).subscribe();
        }
      });

      WakoCacheService.set(CACHE_KEY_PLUGINS, true, CACHE_TIMEOUT_PLUGINS);
    });
  }

  getOpenRemoteAfterClickOnPlaySetting() {
    return this.storage.get(this.getStorageKeyPrefixed('openRemoteAfterClickOnPlay')).then((openRemoteAfterClickOnPlay) => {
      return !!openRemoteAfterClickOnPlay;
    });
  }

  setOpenRemoteAfterClickOnPlaySetting(openRemoteAfterClickOnPlay) {
    return this.storage.set(this.getStorageKeyPrefixed('openRemoteAfterClickOnPlay'), openRemoteAfterClickOnPlay);
  }

  private getPluginsByCategory(category?: 'movie' | 'episode') {
    return from(this.getPlugins()).pipe(
      map((list) => {
        if (!list) {
          return null;
        }
        const newList: KodiPluginList = {};

        Object.keys(list).forEach((key) => {
          const value = list[key];
          if (!value.enabled) {
            return;
          }
          if ((category === 'movie' && value.movieUrl) || (category === 'episode' && value.tvUrl)) {
            newList[key] = value;
          }
        });

        return newList;
      })
    );
  }

  getInstalledPlugins() {
    return KodiGetAddonsForm.submit().pipe(
      catchError(() => {
        return of({ addons: [] });
      }),
      map((plugins) => {
        const installedPlugins: string[] = [];

        plugins.addons.forEach((addon) => {
          installedPlugins.push(addon.addonid);
        });
        return installedPlugins;
      })
    );
  }

  open(kodiOpenMedia: KodiOpenMedia) {
    let pluginList: KodiPluginList = {};

    KodiAppService.checkAndConnectToCurrentHost()
      .pipe(
        catchError((err) => {
          if (err === 'hostUnreachable') {
            this.toastService.simpleMessage('toasts.kodi.hostUnreachable', { hostName: KodiAppService.currentHost.name }, 2000);
          } else {
            this.toastService.simpleMessage('toasts.kodi.noHost');
          }
          return NEVER;
        }),
        switchMap(() => {
          logData('CONNECTED');

          return this.getPluginsByCategory(kodiOpenMedia.category).pipe(
            tap((list) => {
              pluginList = list || {};
            })
          );
        }),
        switchMap(() => this.getInstalledPlugins()),
        map((_installedPlugins) => {
          logData('_installedPlugins', _installedPlugins);
          const supportedAndInstalledPlugins = [];

          Object.keys(pluginList).forEach((pluginId) => {
            const pluginDetail = pluginList[pluginId];
            if (_installedPlugins.includes(pluginDetail.plugin)) {
              supportedAndInstalledPlugins.push(pluginId);
            }
          });
          return supportedAndInstalledPlugins;
        })
      )
      .subscribe((supportedAndInstalledPlugins) => {
        logData('supportedAndInstalledPlugins', supportedAndInstalledPlugins);
        if (supportedAndInstalledPlugins.length === 0) {
          this.toastService.simpleMessage('toasts.kodi.noSupportedPluginsInstalled');

          return;
        }

        if (supportedAndInstalledPlugins.length === 1) {
          this.openOnPlugin(supportedAndInstalledPlugins[0], kodiOpenMedia);
          return;
        }

        const buttons = [];
        Object.keys(pluginList).forEach((pluginId) => {
          const pluginDetail = pluginList[pluginId];

          if (supportedAndInstalledPlugins.includes(pluginId)) {
            buttons.push({
              text: pluginDetail.name,
              handler: () => {
                this.openOnPlugin(pluginId, kodiOpenMedia);
              }
            });
          }
        });

        logData('buttons', buttons);
        if (buttons.length === 1) {
          buttons[0].handler();
          return;
        }

        this.actionSheetController
          .create({
            header: this.translateService.instant('actionSheets.kodi.openTitle'),
            buttons
          })
          .then((action) => {
            action.present();
          });
      });
  }

  private openViaPlaylist(url: string, openMedia: OpenMedia, openRemoteAfterClickOnPlay: boolean) {
    return of(true).pipe(
      switchMap(() =>
        KodiApiService.doHttpAction('Playlist.Clear', {
          playlistid: 0
        })
      ),
      switchMap(() =>
        KodiApiService.doHttpAction('Playlist.Insert', {
          playlistid: 0,
          item: {
            file: url
          },
          position: 0
        })
      ),
      switchMap(() => KodiAppService.stopPlayingIfAny()),
      switchMap(() =>
        KodiApiService.doHttpAction('Player.open', {
          item: {
            playlistid: 0
          }
        })
      ),
      map(() => {
        if (openRemoteAfterClickOnPlay) {
          EventService.emit(EventCategory.kodiRemote, EventName.open);
        }
        if (openMedia) {
          KodiAppService.openMedia$.next(openMedia);
        }

        EventService.emit(EventCategory.kodi, EventName.open);

        return true;
      })
    );
  }

  private openOnPlugin(pluginKey: string, kodiOpenMedia: KodiOpenMedia) {
    this.getPlugins().then((pluginList) => {
      const plugin = pluginList[pluginKey];

      const toastMessage = 'toasts.kodi.open';
      const toastParams = {
        hostName: KodiApiService.host.name,
        pluginName: plugin.name
      };
      const params = this.getKodiPluginParams(plugin, kodiOpenMedia);

      return from(this.getOpenRemoteAfterClickOnPlaySetting())
        .pipe(
          switchMap((openRemoteAfterClickOnPlay) => {
            const openMedia: OpenMedia = {
              movieIds: kodiOpenMedia.movie ? kodiOpenMedia.movie.ids : null,
              showIds: kodiOpenMedia.show ? kodiOpenMedia.show.ids : null,
              seasonNumber: kodiOpenMedia.episode ? kodiOpenMedia.episode.seasonNumber : null,
              episodeNumber: kodiOpenMedia.episode ? kodiOpenMedia.episode.number : null
            };
            const url = `plugin://${plugin.plugin}${params}`;

            logData('Opening: ' + url);

            return this.openViaPlaylist(url, openMedia, openRemoteAfterClickOnPlay);
          }),
          tap((done) => {
            if (!done) {
              this.toastService.simpleMessage('toasts.kodi.failedToOpen');
              return;
            }

            this.toastService.simpleMessage(toastMessage, toastParams);
          })
        )
        .subscribe();
    });
  }

  private replacePlus(str: string) {
    return str ? str.replace(/\s/g, '+') : '';
  }

  private getKodiPluginParams(plugin: KodiPlugin, kodiOpenMedia: KodiOpenMedia) {
    if (kodiOpenMedia.movie) {
      const movie = kodiOpenMedia.movie;

      const rpl: MediaReplacement = {
        tmdbId: movie.ids.tmdb,
        rating: movie.rating,
        date: movie.released,
        title: movie.title,
        tagline: movie.tagline,
        plot: movie.overview,
        original_title: movie.originalTitle,
        imdb: movie.ids.imdb,
        year: movie.year,
        duration: movie.runtime * 60,
        mpaa: movie.certification,
        genres: movie.genres.join(' / '),
        fanart: movie.imagesUrl.backdropOriginal,
        poster: movie.imagesUrl.posterOriginal,
        id: movie.ids.tmdb,
        slug: '',
        trakt: movie.ids.trakt,
        showTmdbId: null,
        seasonNumber: null,
        episodeNumber: null,
        'title_+': this.replacePlus(movie.title),
        tvdb: null,
        season: null,
        episode: null,
        'clearname_+': this.replacePlus(movie.title),
        firstaired: movie.released,
        'plot_+': this.replacePlus(movie.overview),
        thumbnail: movie.imagesUrl.backdropOriginal,
        now: Date.now().toString(),
        banner: movie.imagesUrl.backdropOriginal,
        epimdb: null,
        eptmdb: null,
        eptrakt: null,
        epid: null,
        network_clean: '',
        clearname: movie.title,
        epyear: null,
        tmdb: movie.ids.tmdb,
        episodes: null,
        seasons: null,
        series_firstaired: null,
        seasons_no_specials: null,
        status: null,
        premiered: movie.released
      };

      return this.getPluginParams(plugin.movieUrl, rpl);
    } else {
      const show = kodiOpenMedia.show;
      const episode = kodiOpenMedia.episode;

      let firstAired = '2019-01-01';
      if (show.firstAired) {
        firstAired = show.firstAired;
      }

      let episodeFirstAired = new Date();
      if (typeof episode.firstAired === 'string') {
        episodeFirstAired = new Date(episode.firstAired);
      }

      const rpl: MediaReplacement = {
        showTmdbId: show.ids.tmdb,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.number,
        'title_+': this.replacePlus(episode.title),
        year: show.year,
        imdb: show.ids.imdb,
        tvdb: +show.ids.tvdb,
        season: episode.seasonNumber,
        episode: episode.number,
        'clearname_+': this.replacePlus(show.title),
        firstaired: firstAired,
        duration: episode.runtime * 60,
        'plot_+': this.replacePlus(episode.overview),
        thumbnail: show.imagesUrl.backdropOriginal,
        id: +show.ids.tvdb,
        poster: show.imagesUrl.posterOriginal,
        fanart: show.imagesUrl.backdropOriginal,
        now: Date.now().toString(),
        banner: show.imagesUrl.backdropOriginal,
        epimdb: episode.ids.imdb,
        eptmdb: 0,
        eptrakt: 0,
        epid: +episode.ids.tvdb,
        genres: '',
        mpaa: show.certification,
        title: episode.title,
        plot: episode.overview,
        rating: episode.rating,
        network_clean: '',
        clearname: show.title,
        epyear: episodeFirstAired ? episodeFirstAired.getFullYear() : null,
        slug: '',
        tmdb: show.ids.tmdb,
        trakt: show.ids.trakt,
        episodes: 1,
        seasons: 1,
        series_firstaired: firstAired,
        seasons_no_specials: 1,
        status: 'Continuing',
        tmdbId: show.ids.tmdb,
        date: firstAired,
        tagline: '',
        original_title: episode.title,
        premiered: firstAired
      };

      return this.getPluginParams(plugin.tvUrl, rpl);
    }
  }

  private getPluginParams(url: string, rpl: MediaReplacement) {
    Object.keys(rpl).forEach((key) => {
      const value = escapeText(rpl[key]);

      if (!key.match(/\+/g)) {
        rpl[key] = encodeURIComponent(value);
      }
    });

    return replacer(url, rpl);
  }
}

interface MediaReplacement {
  tmdbId: number;
  rating: number;
  date: string;
  title: string;
  tagline: string;
  plot: string;
  original_title: string;
  imdb: string;
  year: number;
  duration: number;
  mpaa: string;
  genres: string;
  fanart: string;
  poster: string;
  id: number;
  slug: string;
  trakt: number;
  showTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  'title_+': string;
  tvdb: number;
  season: number;
  episode: number;
  'clearname_+': string;
  firstaired: string;
  'plot_+': string;
  thumbnail: string;
  now: string;
  banner: string;
  epimdb: string;
  eptmdb: number;
  eptrakt: number;
  epid: number;
  network_clean: string;
  clearname: string;
  epyear: number;
  tmdb: number;
  episodes: number;
  seasons: number;
  series_firstaired: string;
  seasons_no_specials: number;
  status: string;
  premiered: string;
}
