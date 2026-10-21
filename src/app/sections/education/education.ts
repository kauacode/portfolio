import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../core/content/content.tokens';
import type { Education as EducationItem } from '../../core/content/profile.model';
import { Locale } from '../../core/i18n/locale';
import { Icon } from '../../shared/icon';
import { Marker } from '../../shared/marker';
import { SectionHead } from '../page-section';

@Component({
  selector: 'section[appEducation]',
  imports: [Icon, Marker, SectionHead],
  templateUrl: './education.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Education {
  protected readonly locale = inject(Locale);
  protected readonly profile = inject(PROFILE);

  protected place(edu: EducationItem): string {
    const schedule = edu.schedule?.[this.locale.lang()];
    return [`${edu.school} (${edu.short})`, edu.location, schedule].filter(Boolean).join(' · ');
  }
}
