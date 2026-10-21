import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { SectionKey } from '../content/ui-strings';

// Guarda a chave da seção, não o id: o id muda com o idioma.
@Injectable()
export class ActiveSection {
  private readonly document = inject(DOCUMENT);
  private observer: IntersectionObserver | null = null;

  readonly key = signal<SectionKey | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  observe(hero: Element | null, sections: ReadonlyMap<SectionKey, string>): void {
    this.observer?.disconnect();
    if (!('IntersectionObserver' in globalThis)) return;
    const keys = new Map<Element, SectionKey>();
    for (const [key, id] of sections) {
      const element = this.document.getElementById(id);
      if (element) keys.set(element, key);
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.key.set(keys.get(entry.target) ?? null);
        }
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    if (hero) this.observer.observe(hero);
    keys.forEach((_, element) => this.observer!.observe(element));
  }
}
