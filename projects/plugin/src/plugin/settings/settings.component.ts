import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { KodiPluginList } from '../entities/kodi-plugin';
import { KodiPluginService } from '../services/kodi-plugin.service';
import { ToastService } from '../services/toast.service';

interface PluginArray {
  key: string;
  name: string;
  enabled: boolean;
}

@Component({
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  pluginArray: PluginArray[] = [];

  pluginsUrl = null;

  pluginsList: KodiPluginList = null;

  openRemoteAfterClickOnPlay: boolean;

  isLoading = false;

  constructor(
    private kodiPluginService: KodiPluginService,
    private alertController: AlertController,
    private translateService: TranslateService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.refresh();

    this.kodiPluginService.getOpenRemoteAfterClickOnPlaySetting().then((openRemoteAfterClickOnPlay) => {
      this.openRemoteAfterClickOnPlay = openRemoteAfterClickOnPlay;
    });
  }

  private refresh() {
    this.kodiPluginService.getPluginUrl().then((url) => {
      this.pluginsUrl = url;
    });

    this.kodiPluginService.getPlugins().then((plugins) => {
      this.pluginsList = plugins;

      this.pluginArray = [];

      if (!plugins) {
        return;
      }

      Object.keys(plugins).forEach((key) => {
        const plugin = plugins[key];
        this.pluginArray.push({
          key,
          enabled: plugin.enabled,
          name: plugin.name
        });
      });
    });
  }

  setUrl() {
    this.alertController
      .create({
        header: 'URL',
        inputs: [
          {
            name: 'url',
            type: 'url',
            placeholder: 'URL',
            value: this.pluginsUrl ? this.pluginsUrl : ''
          }
        ],
        buttons: [
          {
            text: this.translateService.instant('alerts.cancelButton'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Ok',
            handler: (data) => {
              this.isLoading = true;
              this.kodiPluginService
                .setPluginsFromUrl(data.url)
                .pipe(finalize(() => (this.isLoading = false)))
                .subscribe((success) => {
                  if (success) {
                    this.toastService.simpleMessage('toasts.kodi-open-button.plugingUrlAdded');
                    this.refresh();
                  } else {
                    this.toastService.simpleMessage('toasts.kodi-open-button.plugingUrlFailedToAdd');
                  }
                });
            }
          }
        ]
      })
      .then((alert) => {
        alert.present();
      });
  }

  toggleProvider(key: string, enabled: boolean) {
    this.pluginsList[key].enabled = enabled;
    this.kodiPluginService.setPlugins(this.pluginsList);
  }

  openRemoteAfterClickOnPlayChange(showHidden: boolean) {
    this.openRemoteAfterClickOnPlay = showHidden;

    this.kodiPluginService.setOpenRemoteAfterClickOnPlaySetting(this.openRemoteAfterClickOnPlay);
  }
}
