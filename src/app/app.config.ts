import { APP_BASE_HREF } from '@angular/common';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { UrlSerializer, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { TrailingSlashUrlSerializer } from './core/browser/trailing-slash-url-serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
    provideClientHydration(withEventReplay()),
    // a versão offline não tem <base href>
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
};
