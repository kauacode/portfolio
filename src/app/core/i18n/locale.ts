import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STRINGS } from '../content/content.tokens';
import { LANGS, type Lang } from '../content/profile.model';
import { SECTION_KEYS, type SectionKey } from '../content/ui-strings';

export const HTML_LANG: Readonly<Record<Lang, string>> = { pt: 'pt-BR', en: 'en' };

export const LANG_NAMES: Readonly<Record<Lang, string>> = { pt: 'Português', en: 'English' };

export const PAGE_PATHS: Readonly<Record<Lang, string>> = { pt: '/', en: '/en/' };

export const otherLang = (lang: Lang): Lang => (lang === 'pt' ? 'en' : 'pt');

// Fornecido por página. Offline não há rota, então o idioma vem do <html lang>.
@Injectable()
export class Locale {
  private readonly strings = inject(STRINGS);

  readonly lang = signal<Lang>(this.initialLang());
  readonly i18n = computed(() => this.strings[this.lang()]);
  readonly text = computed(() => this.i18n().text);

  sectionId(key: SectionKey): string {
    return this.text().ids[key];
  }

  sectionIdIn(lang: Lang, key: SectionKey): string {
    return this.strings[lang].text.ids[key];
  }

  sectionKeyOf(id: string): SectionKey | null {
    return SECTION_KEYS.find((key) => this.sectionId(key) === id) ?? null;
  }

  private initialLang(): Lang {
    const fromRoute = inject(ActivatedRoute, { optional: true })?.snapshot.data['lang'] as Lang | undefined;
    if (fromRoute) return fromRoute;
    const documentLang = inject(DOCUMENT).documentElement.lang;
    return LANGS.find((lang) => HTML_LANG[lang] === documentLang) ?? 'pt';
  }
}
