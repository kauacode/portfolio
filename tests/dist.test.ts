// Rodar depois do build.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import { inlineScripts, scriptHash } from '../scripts/postbuild.ts';

const dist = resolve('dist');
const read = (path: string) => readFileSync(join(dist, path), 'utf8');
const pages = { pt: 'index.html', en: join('en', 'index.html') } as const;
const docs = Object.fromEntries(
  Object.entries(pages).map(([lang, path]) => [lang, new JSDOM(read(path)).window.document]),
) as Record<keyof typeof pages, Document>;

describe('páginas pré-renderizadas', () => {
  it('trazem todo o conteúdo no HTML, sem depender de JavaScript', () => {
    const pt = docs.pt.body.textContent!.replace(/\s+/g, ' ');
    for (const needle of [
      'CI&T',
      'Assist Soluções em TI',
      'CNPEM',
      'AWS Certified Cloud Practitioner',
      'Ciência da Computação',
      'kauabraccio7@gmail.com',
      '2+ anos em desenvolvimento',
      '1 ano e 8 meses de uso profissional · CI&T',
    ]) {
      assert.ok(pt.includes(needle), needle);
    }
  });

  it('têm metadados de busca e compartilhamento completos', () => {
    for (const [lang, doc] of Object.entries(docs)) {
      assert.equal(doc.documentElement.lang, lang === 'pt' ? 'pt-BR' : 'en');
      assert.ok(doc.title.length > 0 && doc.title.length <= 70, doc.title);
      const meta = (key: string) =>
        doc.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.getAttribute('content');
      const description = meta('description') ?? '';
      assert.ok(description.length >= 110 && description.length <= 165, description);
      for (const key of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card']) {
        assert.ok(meta(key), key);
      }
      const canonical = [...doc.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute('href'));
      const alternates = Object.fromEntries(
        [...doc.querySelectorAll('link[rel="alternate"]')].map((l) => [
          l.getAttribute('hreflang'),
          l.getAttribute('href'),
        ]),
      );
      assert.deepEqual(Object.keys(alternates).sort(), ['en', 'pt-BR', 'x-default']);
      assert.equal(canonical.length, 1);
      assert.ok(Object.values(alternates).includes(canonical[0]));
    }
  });

  it('têm dados estruturados (schema.org) da pessoa', () => {
    for (const doc of Object.values(docs)) {
      const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
      assert.equal(blocks.length, 1);
      const person = JSON.parse(blocks[0].textContent!).mainEntity;
      assert.equal(person.name, 'Kauã Braccio');
      assert.equal(person.hasCredential.length, 3);
    }
  });

  it('só referenciam arquivos que existem no dist/', () => {
    for (const doc of Object.values(docs)) {
      const refs = [...doc.querySelectorAll('[href], [src], [srcset]')].flatMap((el) => [
        el.getAttribute('href'),
        el.getAttribute('src'),
        ...(el
          .getAttribute('srcset')
          ?.split(',')
          .map((part) => part.trim().split(' ')[0]) ?? []),
      ]);
      for (const ref of refs) {
        if (!ref || /^(https?:|mailto:|data:|#)/.test(ref)) continue;
        const path = decodeURIComponent(new URL(ref, 'https://site/').pathname);
        const file = join(dist, path);
        assert.ok(existsSync(path.endsWith('/') ? join(file, 'index.html') : file), ref);
      }
    }
  });

  it('não publicam o GitHub nem as fotos originais', () => {
    for (const doc of Object.values(docs)) assert.ok(!doc.documentElement.outerHTML.includes('github.com'));
    const files = readdirSync(dist, { recursive: true }) as string[];
    assert.deepEqual(
      files.filter((f) => f.includes('-original.')),
      [],
    );
  });
});

describe('arquivos de suporte', () => {
  it('a CSP libera, por hash, todos os scripts embutidos', () => {
    const headers = read('_headers');
    for (const path of [...Object.values(pages), '404.html']) {
      for (const script of inlineScripts(read(path))) assert.ok(headers.includes(scriptHash(script)), path);
    }
    const scriptSrc = /script-src ([^;]*)/.exec(headers)?.[1] ?? '';
    assert.match(scriptSrc, /^'self' 'sha256-/);
    assert.ok(!scriptSrc.includes('unsafe-inline'), 'scripts nunca com unsafe-inline');
  });

  it('fotos, fonte e currículo não ficam em cache imutável (os nomes não têm hash)', () => {
    const headers = read('_headers');
    for (const path of ['/assets/img/*', '/assets/fonts/*', '/assets/docs/*']) {
      const block = headers.split('\n\n').find((b) => b.startsWith(path));
      assert.ok(block && !block.includes('immutable'), path);
    }
  });

  it('sitemap, robots, manifest e 404 existem e são válidos', () => {
    assert.equal(read('sitemap.xml').match(/<url>/g)?.length, 2);
    assert.match(read('robots.txt'), /Sitemap: https:\/\//);
    assert.ok(JSON.parse(read('site.webmanifest')).icons.length >= 2);
    const notFound = new JSDOM(read('404.html')).window.document;
    assert.equal(notFound.querySelector('meta[name="robots"]')?.getAttribute('content'), 'noindex');
    for (const name of [
      'favicon.svg',
      'favicon.ico',
      'apple-touch-icon.png',
      'assets/img/og-pt.jpg',
      'assets/img/og-en.jpg',
    ]) {
      assert.ok(existsSync(join(dist, name)), name);
    }
  });
});
