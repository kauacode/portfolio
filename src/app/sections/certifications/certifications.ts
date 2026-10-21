import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../core/content/content.tokens';
import { Locale } from '../../core/i18n/locale';
import { ExternalLink } from '../../shared/external-link';
import { Icon } from '../../shared/icon';
import { Marker } from '../../shared/marker';
import { SectionHead } from '../page-section';

@Component({
  selector: 'section[appCertifications]',
  imports: [ExternalLink, Icon, Marker, SectionHead],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <div appSectionHead="certifications" color="ochre" [heading]="locale.text().cert_title"></div>
      <ul class="certs">
        @for (cert of profile.certifications; track cert.url) {
          <li class="cert">
            <span [appMarker]="cert.color"></span>
            <h3>{{ cert.name }}</h3>
            <p class="issuer">
              {{ cert.issuer }}
              @if (cert.code) {
                · {{ cert.code }}
              }
            </p>
            <p class="dates">
              {{ locale.text().issued }}
              <time [attr.datetime]="cert.issued.iso()">{{ locale.i18n().month(cert.issued) }}</time>
              @if (cert.expires; as expires) {
                · {{ locale.text().valid_until }}
                <time [attr.datetime]="expires.iso()">{{ locale.i18n().month(expires) }}</time>
              }
            </p>
            @if (cert.note) {
              <p class="note">{{ cert.note[locale.lang()] }}</p>
            }
            <a appExternalLink class="verify" [href]="cert.url"
              >{{ locale.text().verify }} <svg appIcon="arrow"></svg
            ></a>
          </li>
        }
      </ul>
      <div class="others">
        <h3 class="label">{{ locale.text().cert_others }}</h3>
        <ul>
          @for (course of profile.courses; track $index) {
            <li>
              <b>{{ course.name[locale.lang()] }}</b
              ><span>{{ course.issuer }}</span>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class Certifications {
  protected readonly locale = inject(Locale);
  protected readonly profile = inject(PROFILE);
}
