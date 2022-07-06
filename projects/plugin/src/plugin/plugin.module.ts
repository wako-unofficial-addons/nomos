import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { MovieButtonComponent } from './movie-button/movie-button.component';
import { PluginService } from './services/plugin.service';

import { FormsModule } from '@angular/forms';
import { IonicStorageModule } from '@ionic/storage-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PluginBaseModule, WakoProviders } from '@wako-app/mobile-sdk';
import { EpisodeButtonComponent } from './episode-button/episode-button.component';
import { EpisodeItemOptionComponent } from './episode-item-option/episode-item-option.component';
import { OpenButtonComponent } from './open-button/open-button.component';
import { KodiPluginService } from './services/kodi-plugin.service';
import { ToastService } from './services/toast.service';
import { SettingsComponent } from './settings/settings.component';

const components = [MovieButtonComponent, EpisodeButtonComponent, EpisodeItemOptionComponent, SettingsComponent, OpenButtonComponent];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule.forRoot(),    IonicStorageModule.forRoot({}), TranslateModule.forRoot()],
  declarations: [...components],
  entryComponents: [...components],
  providers: [PluginService, KodiPluginService, ToastService,
    ...WakoProviders,
  ], // Add your services here. Do not use provideIn: 'root' in your services
})
export class PluginModule extends PluginBaseModule {
  static pluginService = PluginService;
  static settingsComponent = SettingsComponent;
  static movieComponent = MovieButtonComponent;
  static episodeComponent = EpisodeButtonComponent;
  static episodeItemOptionComponent = EpisodeItemOptionComponent;
}
