import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Locale } from '../core/i18n/locale';
import { Curriculum } from './curriculum';
import { Icon } from './icon';

@Component({
  selector: 'a[appCvLink]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.href]': 'cv.href()',
    '[attr.download]': 'cv.fileName()',
    '[attr.hreflang]': "cv.otherLanguage() ? 'pt-BR' : null",
  },
  template: `
    @if (icon()) {
      <svg appIcon="download"></svg>
    }
    @if (compact()) {
      CV
    } @else {
      {{ locale.text().cta_cv }} <small>{{ locale.text().cv_format }}</small>
    }
    @if (cv.otherLanguage()) {
      <span class="sr-only"> ({{ locale.text().cv_other_lang }})</span>
    }
  `,
})
export class CvLink {
  readonly compact = input(false);
  readonly icon = input(true);

  protected readonly locale = inject(Locale);
  protected readonly cv = inject(Curriculum);
}
