// Rodar depois do build.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

const dir = mkdtempSync(join(tmpdir(), 'offline-'));
const file = join(dir, 'kaua-braccio.html');
execFileSync(process.execPath, ['scripts/offline.ts', 'dist', file]);
const html = readFileSync(file, 'utf8');
after(() => rmSync(dir, { recursive: true, force: true }));

describe('versão offline', () => {
  it('embute CSS, JavaScript e arquivos locais (nada é buscado fora do próprio arquivo)', () => {
    assert.doesNotMatch(html, /(?:src|href|srcset)="\/(?:assets\/|favicon|main-|styles-)/);
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    assert.doesNotMatch(style, /url\("?\/assets\//);
    assert.doesNotMatch(html, /<base /);
    assert.match(html, /data:font\/woff2;base64,/);
    assert.equal(html.match(/<script type="module">/g)?.length, 1);
  });

  it('traz o mapa de arquivos que o app usa ao trocar de idioma', () => {
    const source = /<script type="application\/json" id="offline-assets">(.*?)<\/script>/.exec(html)?.[1];
    const map = JSON.parse(source ?? '{}') as Record<string, string>;
    for (const path of [
      '/assets/img/kaua-braccio-640.jpg',
      '/assets/img/kaua-braccio-480.jpg',
      '/assets/docs/Kaua_Braccio_CV.pdf',
    ]) {
      assert.match(map[path] ?? '', /^data:/, path);
    }
  });

  it('usa links relativos ao próprio arquivo', () => {
    assert.doesNotMatch(html, /href="\/(?:en\/)?(?:#[^"]*)?"/);
    assert.match(html, /href="#sobre"/);
  });
});
