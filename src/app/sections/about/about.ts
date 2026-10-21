import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../core/content/content.tokens';
import { Locale } from '../../core/i18n/locale';
import { Marker } from '../../shared/marker';
import { SectionHead } from '../page-section';

@Component({
  selector: 'section[appAbout]',
  imports: [Marker, SectionHead],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <div appSectionHead="about" color="ochre" [heading]="locale.text().about_title"></div>
      <div class="about-grid">
        <div class="prose">
          @for (paragraph of about.paragraphs; track $index) {
            <p>{{ paragraph[locale.lang()] }}</p>
          }
        </div>
        <div class="about-side">
          <p class="label">{{ locale.text().focus_title }}</p>
          <ul class="focus">
            @for (item of about.focus; track $index) {
              <li>
                <span [appMarker]="item.color"></span>
                <h3>{{ item.title[locale.lang()] }}</h3>
                <p>{{ item.text[locale.lang()] }}</p>
              </li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class About {
  protected readonly locale = inject(Locale);
  protected readonly about = inject(PROFILE).about;
}
