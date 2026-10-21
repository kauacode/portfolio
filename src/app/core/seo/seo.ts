import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PROFILE } from '../content/content.tokens';
import { LANGS, type Lang, type Profile } from '../content/profile.model';
import { HTML_LANG, PAGE_PATHS, otherLang } from '../i18n/locale';
import { structuredData } from './structured-data';

const OG_LOCALE: Readonly<Record<Lang, string>> = { pt: 'pt_BR', en: 'en_US' };

export function alternates(siteUrl: string): [string, string][] {
  return [
    ...LANGS.map((lang): [string, string] => [HTML_LANG[lang], canonicalUrl(siteUrl, lang)]),
    ['x-default', `${siteUrl}/`],
  ];
}

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly profile: Profile = inject(PROFILE);

  apply(lang: Lang, today: Date): void {
    const { meta, person, site } = this.profile;
    const title = meta.title[lang];
    const description = meta.description[lang];
    const canonical = canonicalUrl(site.url, lang);
    const image = `${site.url}/assets/img/og-${lang}.jpg`;

    this.document.documentElement.lang = HTML_LANG[lang];
    this.title.setTitle(title);
    const tags: [attr: 'name' | 'property', key: string, content: string][] = [
      ['name', 'description', description],
      ['name', 'author', person.fullName],
      ['name', 'robots', 'index, follow, max-image-preview:large'],
      ['property', 'og:type', 'profile'],
      ['property', 'profile:first_name', person.givenName],
      ['property', 'profile:last_name', person.familyName],
      ['property', 'og:site_name', person.name],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonical],
      ['property', 'og:locale', OG_LOCALE[lang]],
      ['property', 'og:locale:alternate', OG_LOCALE[otherLang(lang)]],
      ['property', 'og:image', image],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['property', 'og:image:alt', meta.ogAlt[lang]],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
      ['name', 'twitter:image', image],
    ];
    for (const [attr, key, content] of tags) {
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }

    this.link('canonical', canonical);
    for (const [hreflang, href] of alternates(site.url)) this.link('alternate', href, hreflang);
    this.jsonLd(structuredData(this.profile, lang, today));
  }

  noIndex(title: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  private link(rel: string, href: string, hreflang?: string): void {
    const selector = `link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ''}`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      if (hreflang) link.setAttribute('hreflang', hreflang);
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private jsonLd(data: object): void {
    let script = this.document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    // evita fechar a tag <script> no meio do JSON
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

export function canonicalUrl(siteUrl: string, lang: Lang): string {
  return siteUrl + PAGE_PATHS[lang];
}
