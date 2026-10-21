import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../core/content/content.tokens';
import type { Text } from '../../core/content/profile.model';
import { Locale } from '../../core/i18n/locale';
import { ExternalLink } from '../../shared/external-link';
import { Marker } from '../../shared/marker';
import { PeriodRange } from '../../shared/period-range';
import { SectionHead } from '../page-section';

@Component({
  selector: 'section[appExperience]',
  imports: [ExternalLink, Marker, PeriodRange, SectionHead],
  templateUrl: './experience.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience {
  protected readonly locale = inject(Locale);
  protected readonly companies = inject(PROFILE).experience;

  protected stack(items: readonly Text[]): string {
    return items.map((item) => item[this.locale.lang()]).join(', ');
  }
}
