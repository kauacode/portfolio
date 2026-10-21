import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE, STRINGS } from '../core/content/content.tokens';
import { PAGE_PATHS } from '../core/i18n/locale';
import { Seo } from '../core/seo/seo';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container nf">
      <p class="label">404</p>
      <h1>{{ pt.nf_title }}</h1>
      <p class="lede">
        {{ pt.nf_text }} <span lang="en">{{ en.nf_text }}</span>
      </p>
      <div class="ctas">
        <a class="btn btn-primary" [href]="paths.pt">{{ pt.nf_back }}</a>
        <a class="btn btn-ghost" [href]="paths.en" lang="en">{{ en.nf_back }}</a>
      </div>
    </main>
  `,
})
export class NotFoundPage {
  private readonly strings = inject(STRINGS);
  protected readonly pt = this.strings.pt.text;
  protected readonly en = this.strings.en.text;
  protected readonly paths = PAGE_PATHS;

  constructor() {
    inject(Seo).noIndex(`404 · ${inject(PROFILE).person.name}`);
  }
}
