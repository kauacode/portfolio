import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PageNavigation } from '../core/browser/page-navigation';
import { PROFILE } from '../core/content/content.tokens';
import { HTML_LANG, LANG_NAMES, Locale, otherLang } from '../core/i18n/locale';
import { CvLink } from '../shared/cv-link';
import { ExternalLink } from '../shared/external-link';

@Component({
  selector: 'footer[appSiteFooter]',
  imports: [CvLink, ExternalLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'site-footer' },
  template: `
    <div class="container footer-row">
      <p>
        © {{ profile.site.updated.year }} {{ profile.person.fullName }} · {{ locale.text().updated }}
        {{ locale.i18n().month(profile.site.updated) }}
      </p>
      <nav [attr.aria-label]="locale.text().footer_nav_label">
        <ul>
          <li>
            <a appExternalLink [href]="profile.person.linkedin">LinkedIn</a>
          </li>
          @if (profile.site.showGithub) {
            <li>
              <a appExternalLink [href]="profile.person.github">GitHub</a>
            </li>
          }
          <li>
            <a [href]="'mailto:' + profile.person.email">{{ locale.text().email_label }}</a>
          </li>
          <li><a appCvLink [compact]="true" [icon]="false"></a></li>
          <li>
            <a
              [href]="nav.page(other().lang)"
              [attr.hreflang]="other().htmlLang"
              [attr.lang]="other().htmlLang"
              (click)="nav.switchLanguage(other().lang, $event)"
              >{{ other().name }}</a
            >
          </li>
        </ul>
      </nav>
    </div>
  `,
})
export class SiteFooter {
  protected readonly profile = inject(PROFILE);
  protected readonly locale = inject(Locale);
  protected readonly nav = inject(PageNavigation);
  protected readonly other = computed(() => {
    const lang = otherLang(this.locale.lang());
    return { lang, htmlLang: HTML_LANG[lang], name: LANG_NAMES[lang] };
  });
}
