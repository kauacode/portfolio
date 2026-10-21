// Roda depois do ng build: 404.html, _headers (CSP com hash dos scripts inline), sitemap, robots e manifest.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import profile from '../content/profile.json' with { type: 'json' };

const dist = resolve(process.argv[2] ?? 'dist');
const siteUrl = profile.site.url.replace(/\/+$/, '');
const pages = [
  { hreflang: 'pt-BR', path: '/' },
  { hreflang: 'en', path: '/en/' },
];

export function scriptHash(source: string): string {
  return `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;
}

export function inlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const type = /\btype="([^"]*)"/.exec(attrs)?.[1] ?? 'text/javascript';
    const executable = ['text/javascript', 'module', 'application/javascript'].includes(type);
    if (executable && !/\bsrc=/.test(attrs) && body.trim()) scripts.push(body);
  }
  return scripts;
}

function contentSecurityPolicy(hashes: string[]): string {
  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': ["'self'", ...hashes].join(' '),
    // atributos style="--c: …" definem a cor de cada item
    'style-src': "'self' 'unsafe-inline'",
    'font-src': "'self'",
    'img-src': "'self' data:",
    'connect-src': "'self'",
    'manifest-src': "'self'",
    'base-uri': "'self'",
    'form-action': "'none'",
    'frame-ancestors': "'none'",
    'object-src': "'none'",
  };
  return Object.entries(directives)
    .map(([name, value]) => `${name} ${value}`)
    .join('; ');
}

function headersFile(hashes: string[]): string {
  const security = {
    'Content-Security-Policy': contentSecurityPolicy(hashes),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  };
  // fotos, fonte e CV não têm hash no nome, então nada de immutable
  const rules: [string, Record<string, string>][] = [
    ['/*', security],
    ['/assets/img/*', { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' }],
    ['/assets/fonts/*', { 'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=2592000' }],
    ['/assets/docs/*', { 'Cache-Control': 'public, max-age=3600, must-revalidate' }],
  ];
  return (
    rules
      .map(([path, values]) =>
        [path, ...Object.entries(values).map(([key, value]) => `  ${key}: ${value}`)].join('\n'),
      )
      .join('\n\n') + '\n'
  );
}

function sitemap(lastmod: string): string {
  const alternates = [...pages, { hreflang: 'x-default', path: '/' }]
    .map((p) => `<xhtml:link rel="alternate" hreflang="${p.hreflang}" href="${siteUrl}${p.path}"/>`)
    .join('');
  const urls = pages
    .map((p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${lastmod}</lastmod>${alternates}</url>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}

function manifest(): string {
  const { name, title } = profile.person;
  const data = {
    name: `${name} · ${typeof title === 'string' ? title : title.pt}`,
    short_name: name,
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#ffffff',
    theme_color: '#121112',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return JSON.stringify(data, null, 2) + '\n';
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => join(e.parentPath, e.name));
}

async function main(): Promise<void> {
  if (existsSync(join(dist, '404', 'index.html'))) {
    await rename(join(dist, '404', 'index.html'), join(dist, '404.html'));
    await rm(join(dist, '404'), { recursive: true });
  }
  // arquivos que só servem para SSR com servidor
  await rm(join(dist, 'index.csr.html'), { force: true });
  await rm(join(dist, 'prerendered-routes.json'), { force: true });

  const hashes = new Set<string>();
  for (const file of await htmlFiles(dist)) {
    for (const script of inlineScripts(await readFile(file, 'utf8'))) hashes.add(scriptHash(script));
  }

  const epoch = process.env['SOURCE_DATE_EPOCH'];
  const today = epoch ? new Date(Number(epoch) * 1000) : new Date();
  const lastmod = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-');
  await writeFile(join(dist, '_headers'), headersFile([...hashes].sort()));
  await writeFile(join(dist, 'sitemap.xml'), sitemap(lastmod));
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  await writeFile(join(dist, 'site.webmanifest'), manifest());
  console.log(`postbuild: 404.html, _headers (${hashes.size} scripts embutidos), sitemap, robots e manifest`);
}

if (import.meta.main) await main();
