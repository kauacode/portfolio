import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

// O tema salvo é aplicado antes da primeira pintura pelo script do index.html.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly root = this.document.documentElement;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly prefersDark = this.media('(prefers-color-scheme: dark)');
  private readonly reduceMotion = this.media('(prefers-reduced-motion: reduce)');

  readonly effective = signal<Theme>(this.compute());
  private transition: ViewTransition | null = null;
  // tema da transição em andamento, que ainda não foi aplicado
  private pending: Theme | null = null;

  constructor() {
    this.prefersDark?.addEventListener('change', () => this.sync());
    this.sync();
  }

  toggle(origin: HTMLElement): void {
    const next: Theme = (this.pending ?? this.effective()) === 'dark' ? 'light' : 'dark';
    const view = this.document.defaultView;
    if (!this.document.startViewTransition || !view || this.reduceMotion?.matches) {
      this.apply(next);
      return;
    }
    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y));
    this.transition?.skipTransition();
    this.root.classList.add('theme-vt');
    const transition = this.document.startViewTransition(() => this.apply(next));
    this.transition = transition;
    this.pending = next;
    transition.ready
      .then(() =>
        this.root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 600,
            easing: 'cubic-bezier(.2, .8, .2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        ),
      )
      .catch(() => undefined);
    transition.finished.finally(() => {
      // um clique rápido já pode ter iniciado outra transição
      if (this.transition !== transition) return;
      this.transition = null;
      this.pending = null;
      this.root.classList.remove('theme-vt');
    });
  }

  private apply(theme: Theme): void {
    this.root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage bloqueado (modo privado)
    }
    this.sync();
  }

  private media(query: string): MediaQueryList | null {
    const view = this.document.defaultView;
    return this.browser && typeof view?.matchMedia === 'function' ? view.matchMedia(query) : null;
  }

  private compute(): Theme {
    const chosen = this.root.getAttribute('data-theme');
    if (chosen === 'dark' || chosen === 'light') return chosen;
    return this.prefersDark?.matches ? 'dark' : 'light';
  }

  private sync(): void {
    if (!this.browser) return;
    const theme = this.compute();
    this.effective.set(theme);
    if (this.root.hasAttribute('data-theme')) {
      this.document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = theme === 'dark' ? '#121112' : '#ffffff';
        meta.removeAttribute('media');
      });
    }
  }
}
