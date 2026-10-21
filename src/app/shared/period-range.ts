import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TODAY } from '../core/content/content.tokens';
import type { Period } from '../core/dates';
import { Locale } from '../core/i18n/locale';

@Component({
  selector: '[appPeriodRange]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // " – atual · " precisa ser um único nó de texto, senão o kerning muda
  template: `
    @if (period().end; as end) {
      <time [attr.datetime]="period().start.iso()">{{ i18n().month(period().start) }}</time> –
      <time [attr.datetime]="end.iso()">{{ i18n().month(end) }}</time> · <span>{{ duration() }}</span>
    } @else {
      <time [attr.datetime]="period().start.iso()">{{ i18n().month(period().start) }}</time>
      – {{ i18n().text.present }} · <span>{{ duration() }}</span>
    }
  `,
})
export class PeriodRange {
  readonly period = input.required<Period>({ alias: 'appPeriodRange' });

  private readonly locale = inject(Locale);
  private readonly today = inject(TODAY);
  protected readonly i18n = this.locale.i18n;
  protected readonly duration = computed(() => this.i18n().duration(this.period().months(this.today)));
}
