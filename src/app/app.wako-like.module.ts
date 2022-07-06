import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { IonicStorageModule } from '@ionic/storage-angular';
import { TranslateModule } from '@ngx-translate/core';
import { WakoProviders } from '@wako-app/mobile-sdk';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      swipeBackEnabled: true,
      backButtonText: '',
      mode: 'md',
    }),
    AppRoutingModule,
    TranslateModule.forRoot(),
    IonicStorageModule.forRoot({}),
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, ...WakoProviders],
  bootstrap: [AppComponent],
})
export class AppWakoLikeModule {}
