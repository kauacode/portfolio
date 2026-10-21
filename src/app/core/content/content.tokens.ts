import { InjectionToken } from '@angular/core';
import profileJson from '../../../../content/profile.json';
import uiJson from '../../../../content/ui.json';
import { parseProfile } from './parse-profile';
import type { Lang, Profile } from './profile.model';
import { loadStrings, type UiStrings } from './ui-strings';

export const PROFILE = new InjectionToken<Profile>('PROFILE', {
  providedIn: 'root',
  factory: () => parseProfile(profileJson),
});

export const STRINGS = new InjectionToken<Record<Lang, UiStrings>>('STRINGS', {
  providedIn: 'root',
  factory: () => loadStrings(uiJson),
});

interface NodeGlobal {
  process?: { env: Record<string, string | undefined> };
}

// No prerender é a data do build (ou SOURCE_DATE_EPOCH, para build reproduzível); no navegador, a da visita.
export const TODAY = new InjectionToken<Date>('TODAY', {
  providedIn: 'root',
  factory: () => {
    const epoch = (globalThis as NodeGlobal).process?.env['SOURCE_DATE_EPOCH'];
    return epoch ? new Date(Number(epoch) * 1000) : new Date();
  },
});
