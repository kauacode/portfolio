import { ChangeDetectionStrategy, Component, DOCUMENT, afterNextRender, effect, inject } from '@angular/core';
import { ActiveSection } from '../core/browser/active-section';
import { PageNavigation } from '../core/browser/page-navigation';
import { TODAY } from '../core/content/content.tokens';
import { SECTION_KEYS } from '../core/content/ui-strings';
import { Locale } from '../core/i18n/locale';
import { Seo } from '../core/seo/seo';
import { SiteFooter } from '../layout/site-footer';
import { SiteHeader } from '../layout/site-header';
import { About } from '../sections/about/about';
import { Certifications } from '../sections/certifications/certifications';
import { Contact } from '../sections/contact/contact';
import { Education } from '../sections/education/education';
import { Experience } from '../sections/experience/experience';
import { Hero } from '../sections/hero/hero';
import { PageSection } from '../sections/page-section';
import { Skills } from '../sections/skills/skills';
import { Curriculum } from '../shared/curriculum';

@Component({
  selector: 'app-home-page',
  imports: [
    SiteHeader,
    SiteFooter,
    PageSection,
    Hero,
    About,
    Experience,
    Education,
    Certifications,
    Skills,
    Contact,
  ],
  providers: [Locale, ActiveSection, PageNavigation, Curriculum],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" [href]="nav.anchor('conteudo')">{{ locale.text().skip }}</a>
    <header appSiteHeader></header>
    <main id="conteudo">
      <section appHero></section>
      <section appPageSection="about" appAbout></section>
      <section appPageSection="experience" appExperience></section>
      <section appPageSection="education" appEducation></section>
      <section appPageSection="certifications" field="purple" appCertifications></section>
      <section appPageSection="skills" appSkills></section>
      <section appPageSection="contact" class="contact-section" appContact></section>
    </main>
    <footer appSiteFooter></footer>
  `,
})
export class HomePage {
  protected readonly locale = inject(Locale);
  protected readonly nav = inject(PageNavigation);

  constructor() {
    const seo = inject(Seo);
    const today = inject(TODAY);
    effect(() => seo.apply(this.locale.lang(), today));

    const document = inject(DOCUMENT);
    const active = inject(ActiveSection);
    afterNextRender(() =>
      active.observe(
        document.querySelector('.hero'),
        new Map(SECTION_KEYS.map((key) => [key, this.locale.sectionId(key)])),
      ),
    );
  }
}
