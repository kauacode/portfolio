import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import profileJson from '../../../content/profile.json';
import { PROFILE, TODAY } from '../core/content/content.tokens';
import { parseProfile } from '../core/content/parse-profile';
import type { Lang } from '../core/content/profile.model';
import { HomePage } from './home-page';

async function render(lang: Lang, profile = profileJson): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { data: { lang } } } },
      { provide: TODAY, useValue: new Date(2026, 9, 20) },
      { provide: PROFILE, useValue: parseProfile(profile) },
    ],
  });
  const fixture = TestBed.createComponent(HomePage);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const text = (page: HTMLElement) => page.textContent!.replace(/\s+/g, ' ');

describe('HomePage', () => {
  it('deriva os fatos das datas e das certificações', async () => {
    const pt = text(await render('pt'));
    expect(pt).toContain('2+ anos em desenvolvimento');
    expect(pt).toContain('2× AWS Certified');
    expect(pt).toContain('1 ano e 8 meses de uso profissional · CI&T');
    expect(pt).toContain('dez. 2025 – atual · 11 meses');
  });

  it('traduz textos e rótulos na versão em inglês', async () => {
    const page = await render('en');
    expect(text(page)).toContain('1 year 8 months of professional use · CI&T');
    expect(page.querySelector('.channel-email .channel-label')?.textContent).toBe('Email');
    expect(page.querySelector('#experience')).not.toBeNull();
  });

  it('tem ids únicos e âncoras que apontam para elementos da página', async () => {
    const page = await render('pt');
    const ids = [...page.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')) {
      const target = link.getAttribute('href')!.split('#')[1];
      expect(ids, link.outerHTML).toContain(target);
    }
    for (const el of page.querySelectorAll('[aria-labelledby], [aria-controls]')) {
      const ref = el.getAttribute('aria-labelledby') ?? el.getAttribute('aria-controls')!;
      expect(ids).toContain(ref);
    }
  });

  it('tem um h1 e não pula níveis de título', async () => {
    const levels = [...(await render('pt')).querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
      Number(h.tagName[1]),
    );
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.slice(1).forEach((level, i) => expect(level - levels[i]).toBeLessThanOrEqual(1));
  });

  it('avisa que o currículo da versão em inglês está em português', async () => {
    const en = [...(await render('en')).querySelectorAll('a[download]')];
    expect(en.length).toBeGreaterThan(0);
    for (const link of en) {
      expect(link.getAttribute('hreflang')).toBe('pt-BR');
      expect(link.getAttribute('download')).toBe('Kaua_Braccio_CV.pdf');
    }
    TestBed.resetTestingModule();
    for (const link of (await render('pt')).querySelectorAll('a[download]')) {
      expect(link.getAttribute('hreflang')).toBeNull();
    }
  });

  it('esconde o GitHub, a menos que show_github seja true', async () => {
    expect((await render('pt')).innerHTML).not.toContain('github.com');
    TestBed.resetTestingModule();
    const withGithub = structuredClone(profileJson);
    withGithub.site.show_github = true;
    expect((await render('pt', withGithub)).innerHTML).toContain('github.com/kauacode');
  });

  it('abre links externos em nova aba com noopener e avisa leitores de tela', async () => {
    for (const link of (await render('pt')).querySelectorAll('a[target="_blank"]')) {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.querySelector('.sr-only')?.textContent).toContain('abre em nova aba');
    }
  });

  it('dá texto alternativo e dimensões a todas as imagens', async () => {
    for (const img of (await render('pt')).querySelectorAll('img')) {
      expect(img.hasAttribute('alt')).toBe(true);
      expect(img.getAttribute('width') && img.getAttribute('height')).toBeTruthy();
    }
  });
});
