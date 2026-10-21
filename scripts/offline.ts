// Gera um único .html com tudo embutido, para abrir sem servidor (file://).
// Uso: node scripts/offline.ts [dist] [saída=offline/kaua-braccio.html]
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const outFile = resolve(process.argv[3] ?? join('offline', 'kaua-braccio.html'));
const MIME: Record<string, string> = {
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

async function dataUri(path: string): Promise<string> {
  const mime = MIME[extname(path)];
  if (!mime) throw new Error(`tipo de arquivo sem MIME definido: ${path}`);
  return `data:${mime};base64,${(await readFile(join(dist, path))).toString('base64')}`;
}

async function embedLocalFiles(source: string, pattern: RegExp): Promise<[string, Map<string, string>]> {
  const files = new Map<string, string>();
  for (const [, path] of source.matchAll(pattern)) {
    if (!files.has(path)) files.set(path, await dataUri(path));
  }
  return [source.replace(pattern, (match, path: string) => match.replace(path, files.get(path)!)), files];
}

async function main(): Promise<void> {
  let html = await readFile(join(dist, 'index.html'), 'utf8');

  // módulos JS não carregam via file://, então tudo vai inline
  const css = /<link rel="stylesheet" href="(styles-[\w-]+\.css)">/.exec(html);
  const js = /<script src="(main-[\w-]+\.js)" type="module"><\/script>/.exec(html);
  if (!css || !js) throw new Error('dist/index.html sem o CSS ou o JS do Angular; rode npm run build');
  const script = await readFile(join(dist, js[1]), 'utf8');
  if (/\bimport\s*\(?\s*["']\.\/chunk-/.test(script)) {
    throw new Error('o bundle tem chunks separados; a versão offline precisa de um único main.js');
  }
  const [style] = await embedLocalFiles(
    await readFile(join(dist, css[1]), 'utf8'),
    /url\("?(\/assets\/[^")]+)"?\)/g,
  );

  html = html
    .replace(/<base href="\/">\s*/, '')
    .replace(/<link rel="(?:preload|manifest|apple-touch-icon)"[^>]*>\s*/g, '')
    .replace(/<link rel="icon" href="\/favicon\.ico"[^>]*>\s*/, '')
    .replace(/ (?:srcset|sizes)="[^"]*"/g, '')
    .replace(css[0], () => `<style>${style}</style>`)
    .replace(js[0], () => `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`);

  const [embedded, files] = await embedLocalFiles(html, /(?:src|href)="(\/assets\/[^"]+|\/favicon\.svg)"/g);
  html = embedded.replace(/href="\/(?:en\/)?#/g, 'href="#').replace(/href="\/(?:en\/)?"/g, 'href="#"');

  // usado por Assets.url() quando o idioma troca e as imagens são renderizadas de novo
  const map = JSON.stringify(Object.fromEntries(files)).replace(/</g, '\\u003c');
  html = html.replace(
    '<script type="module">',
    `<script type="application/json" id="offline-assets">${map}</script><script type="module">`,
  );

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html);
  console.log(`${outFile} (${Math.round((await stat(outFile)).size / 1024)} KB)`);
}

await main();
