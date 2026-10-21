import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { Assets } from './core/browser/assets';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';

export const routes: Routes = [
  { path: '', component: HomePage, data: { lang: 'pt' } },
  { path: 'en', component: HomePage, data: { lang: 'en' } },
  // vira /404.html no postbuild
  { path: '404', component: NotFoundPage },
  // offline a URL é o caminho do arquivo no disco
  { path: '**', component: HomePage, canMatch: [() => inject(Assets).offline] },
  { path: '**', component: NotFoundPage },
];
