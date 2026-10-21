import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActiveSection } from '../core/browser/active-section';
import { PageNavigation } from '../core/browser/page-navigation';
import { ThemeService } from '../core/browser/theme';
import { onWindowScroll } from '../core/browser/window-scroll';
import { PROFILE } from '../core/content/content.tokens';
import { LANGS } from '../core/content/profile.model';
import { SECTION_KEYS } from '../core/content/ui-strings';
import { HTML_LANG, LANG_NAMES, Locale } from '../core/i18n/locale';
import { CvLink } from '../shared/cv-link';
import { Icon } from '../shared/icon';

@Component({
  selector: 'header[appSiteHeader]',
  imports: [CvLink, Icon],
  templateUrl: './site-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'site-header',
    '[class.is-scrolled]': 'scrolled()',
    '(document:keydown.escape)': 'closeAndFocus()',
    '(document:click)': 'closeIfOutside($event)',
  },
})
export class SiteHeader {
  protected readonly locale = inject(Locale);
  protected readonly nav = inject(PageNavigation);
  protected readonly theme = inject(ThemeService);
  private readonly active = inject(ActiveSection);
  protected readonly name = inject(PROFILE).person.name;

  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly navElement = viewChild.required<ElementRef<HTMLElement>>('navElement');

  protected readonly sections = computed(() =>
    SECTION_KEYS.map((key) => {
      const id = this.locale.sectionId(key);
      return { id, label: this.locale.text().nav[key], current: this.active.key() === key };
    }),
  );
  protected readonly languages = computed(() =>
    LANGS.map((lang) => ({
      lang,
      code: lang.toUpperCase(),
      htmlLang: HTML_LANG[lang],
      name: LANG_NAMES[lang],
      current: lang === this.locale.lang(),
    })),
  );

  constructor() {
    onWindowScroll((view) => this.scrolled.set(view.scrollY > 8));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeAndFocus(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.menuButton().nativeElement.focus();
  }

  protected closeIfOutside(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.menuOpen() &&
      !this.navElement().nativeElement.contains(target) &&
      !this.menuButton().nativeElement.contains(target)
    ) {
      this.menuOpen.set(false);
    }
  }
}
