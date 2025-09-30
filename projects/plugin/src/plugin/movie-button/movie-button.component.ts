import { Component } from '@angular/core';
import { Movie, MovieDetailBaseComponent } from '@wako-app/mobile-sdk';

@Component({
    selector: 'app-movie-button',
    templateUrl: './movie-button.component.html',
    styleUrls: ['./movie-button.component.scss'],
    standalone: false
})
export class MovieButtonComponent extends MovieDetailBaseComponent {
  movie: Movie;

  setMovie(movie: Movie): any {
    this.movie = movie;
  }
}
