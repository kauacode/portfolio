// Capturas de página inteira (pt/en, 1440/768/390, claro/escuro) em .qa/. Rodar depois do build.
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const dist = resolve('dist');
const outDir = resolve('.qa');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

function serve(root: string) {
  return createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
    let file = join(root, path);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      await stat(file);
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    } catch {
      file = join(root, '404.html');
      response.writeHead(404, { 'Content-Type': TYPES['.html'] });
    }
    createReadStream(file).pipe(response);
  });
}

const server = serve(dist).listen(0, '127.0.0.1');
await new Promise((ready) => server.once('listening', ready));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const browser = await chromium.launch({ channel: 'chrome' });
try {
  await mkdir(outDir, { recursive: true });
  for (const [lang, path] of [
    ['pt', '/'],
    ['en', '/en/'],
  ] as const) {
    for (const width of [1440, 768, 390]) {
      for (const colorScheme of ['light', 'dark'] as const) {
        const mobile = width < 768;
        const context = await browser.newContext({
          viewport: { width, height: mobile ? 844 : 900 },
          isMobile: mobile,
          hasTouch: mobile,
          colorScheme,
          reducedMotion: 'reduce', // senão as seções ainda estão invisíveis (animação de entrada)
        });
        const page = await context.newPage();
        await page.goto(base + path);
        await page.evaluate(() => document.fonts.ready);
        const file = join(outDir, `${lang}-${width}-${colorScheme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(file);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}
