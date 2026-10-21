import { DOCUMENT, Injectable, Injector, afterNextRender, inject } from '@angular/core';
import type { Lang } from '../content/profile.model';
import { Locale, PAGE_PATHS } from '../i18n/locale';
import { ActiveSection } from './active-section';
import { Assets } from './assets';

// Com <base href="/">, um href="#x" iria para a home; por isso as âncoras levam o caminho da página.
@Injectable()
export class PageNavigation {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly locale = inject(Locale);
  private readonly active = inject(ActiveSection);
  private readonly offline = inject(Assets).offline;

  page(lang: Lang = this.locale.lang()): string {
    return this.offline ? '#' : PAGE_PATHS[lang];
  }

  anchor(id: string): string {
    return this.offline ? `#${id}` : `${PAGE_PATHS[this.locale.lang()]}#${id}`;
  }

  switchLanguage(lang: Lang, event: MouseEvent): void {
    if (!isPlainClick(event)) return; // deixa Ctrl+clique abrir em nova aba
    event.preventDefault();
    const key = this.active.key() ?? this.locale.sectionKeyOf(this.document.location.hash.slice(1));
    const target = key ? this.locale.sectionIdIn(lang, key) : null;
    if (!this.offline) {
      this.document.location.assign(PAGE_PATHS[lang] + (target ? `#${target}` : ''));
      return;
    }
    this.locale.lang.set(lang);
    afterNextRender(
      () => {
        const section = target ? this.document.getElementById(target) : null;
        if (section) section.scrollIntoView({ behavior: 'instant' });
        else this.document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
      },
      { injector: this.injector },
    );
  }

  home(event: MouseEvent): void {
    if (!this.offline || !isPlainClick(event)) return;
    event.preventDefault();
    this.document.defaultView?.scrollTo({ top: 0 });
  }
}

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
