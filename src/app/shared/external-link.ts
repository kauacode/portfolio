import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Locale } from '../core/i18n/locale';

@Component({
  selector: 'a[appExternalLink]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { target: '_blank', rel: 'noopener' },
  template: `<ng-content /><span class="sr-only"> ({{ locale.text().new_tab }})</span>`,
})
export class ExternalLink {
  protected readonly locale = inject(Locale);
}
