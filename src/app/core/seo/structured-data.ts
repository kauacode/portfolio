import type { Lang, Profile } from '../content/profile.model';
import { YearMonth } from '../dates';
import { HTML_LANG, PAGE_PATHS } from '../i18n/locale';

export function structuredData(profile: Profile, lang: Lang, today: Date) {
  const { person, site, meta } = profile;
  const knowsAbout = [
    ...new Set([
      ...profile.coreSkills.map((skill) => skill.name),
      ...profile.skillGroups.flatMap((group) => group.items.map((item) => item[lang])),
    ]),
  ];
  // WebSite com nome: sem ele, o Google mostra "Cloudflare" como nome do site nos resultados
  const website = {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: person.name,
    alternateName: person.alternateNames,
    url: `${site.url}/`,
    inLanguage: Object.values(HTML_LANG),
  };
  const profilePage = {
    '@type': 'ProfilePage',
    isPartOf: { '@id': website['@id'] },
    url: site.url + PAGE_PATHS[lang],
    inLanguage: HTML_LANG[lang],
    dateModified: `${YearMonth.of(today).iso()}-${String(today.getDate()).padStart(2, '0')}`,
    mainEntity: {
      '@type': 'Person',
      '@id': `${site.url}/#person`,
      name: person.name,
      alternateName: person.alternateNames,
      givenName: person.givenName,
      familyName: person.familyName,
      jobTitle: person.title[lang],
      description: meta.description[lang],
      image: `${site.url}/assets/img/kaua-braccio-640.jpg`,
      url: `${site.url}/`,
      email: `mailto:${person.email}`,
      worksFor: { '@type': 'Organization', name: person.company, url: person.companyUrl },
      address: {
        '@type': 'PostalAddress',
        addressLocality: person.locality,
        addressRegion: person.region,
        addressCountry: person.countryCode,
      },
      alumniOf: profile.education.map((e) => ({
        '@type': 'EducationalOrganization',
        name: `${e.school} (${e.short})`,
      })),
      knowsLanguage: Object.values(HTML_LANG),
      knowsAbout,
      hasCredential: profile.certifications.map((c) => ({
        '@type': 'EducationalOccupationalCredential',
        name: c.name,
        credentialCategory: 'certification',
        url: c.url,
        dateCreated: c.issued.iso(),
        ...(c.expires ? { expires: c.expires.iso() } : {}),
        recognizedBy: { '@type': 'Organization', name: c.issuer },
      })),
      sameAs: [person.linkedin, ...(site.showGithub ? [person.github] : [])],
    },
  };
  return { '@context': 'https://schema.org', '@graph': [website, profilePage] };
}
