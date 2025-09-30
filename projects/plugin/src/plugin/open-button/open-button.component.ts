import { Component, Input } from '@angular/core';
import { KodiPluginService } from '../services/kodi-plugin.service';
import { Episode, Movie, Show } from '@wako-app/mobile-sdk';

@Component({
    selector: 'wk-open-button',
    templateUrl: './open-button.component.html',
    styleUrls: ['./open-button.component.scss'],
    standalone: false
})
export class OpenButtonComponent {
  @Input() movie: Movie;
  @Input() show: Show;
  @Input() episode: Episode;
  @Input() type: 'button' | 'item-option' = 'button';

  constructor(private kodiPluginService: KodiPluginService) {
  }

  async open() {
    this.kodiPluginService.open({
      category: this.movie ? 'movie' : 'episode',
      movie: this.movie,
      show: this.show,
      episode: this.episode
    });
  }
}
