import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Assets } from '../../core/browser/assets';
import { PROFILE } from '../../core/content/content.tokens';
import { Locale } from '../../core/i18n/locale';
import { Curriculum } from '../../shared/curriculum';
import { ExternalLink } from '../../shared/external-link';
import { Icon } from '../../shared/icon';

const STATUS_TIMEOUT_MS = 3500;

@Component({
  selector: 'section[appContact]',
  imports: [ExternalLink, Icon],
  templateUrl: './contact.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  protected readonly locale = inject(Locale);
  protected readonly person = inject(PROFILE).person;
  protected readonly assets = inject(Assets);
  private readonly document = inject(DOCUMENT);
  private readonly emailLink = viewChild.required<ElementRef<HTMLAnchorElement>>('emailLink');

  protected readonly emailParts = this.person.email.split('@');
  protected readonly linkedinHandle = this.person.linkedin.replace(/\/+$/, '').split('linkedin.com/').at(-1);
  protected readonly cv = inject(Curriculum);
  protected readonly place = computed(
    () => `${this.person.area[this.locale.lang()]} · ${this.locale.text().contact_timezone}`,
  );

  // sem JS o botão não faria nada, então só aparece depois de hidratar
  protected readonly canCopy = signal(false);
  protected readonly copyStatus = signal('');
  private statusTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => this.canCopy.set(true));
    inject(DestroyRef).onDestroy(() => clearTimeout(this.statusTimer));
  }

  protected async copyEmail(): Promise<void> {
    const text = this.locale.text();
    try {
      await navigator.clipboard.writeText(this.person.email);
      this.copyStatus.set(text.copied);
    } catch {
      // sem acesso ao clipboard: seleciona o texto
      const range = this.document.createRange();
      range.selectNodeContents(this.emailLink().nativeElement);
      const selection = this.document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      this.copyStatus.set(text.copy_fail);
    }
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => this.copyStatus.set(''), STATUS_TIMEOUT_MS);
  }
}
