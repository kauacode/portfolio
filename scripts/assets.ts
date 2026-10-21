// Retratos, ícones e imagens OG. Rodar só quando a foto mudar.
// Uso: node scripts/assets.ts [saída=public]
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import profile from '../content/profile.json' with { type: 'json' };

const out = resolve(process.argv[2] ?? 'public');
const img = join(out, 'assets', 'img');
const PORTRAIT_WIDTHS = [320, 480, 640];

async function portraits(): Promise<void> {
  const source = sharp(resolve('media', 'kaua-braccio-original.jpg'));
  const { width = 0, height = 0 } = await source.metadata();
  const cropWidth = Math.round((height * 4) / 5); // o original é quadrado
  const base = source.extract({
    left: Math.floor((width - cropWidth) / 2),
    top: 0,
    width: cropWidth,
    height,
  });
  for (const w of PORTRAIT_WIDTHS) {
    const resized = base.clone().resize(w, Math.round((w * 5) / 4));
    const stem = join(img, `kaua-braccio-${w}`);
    await resized.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(`${stem}.jpg`);
    await resized.clone().webp({ quality: 80, effort: 6 }).toFile(`${stem}.webp`);
    await resized.clone().avif({ quality: 60 }).toFile(`${stem}.avif`);
  }
}

function ico(pngs: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // tipo: ícone
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4); // planos
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function icons(): Promise<void> {
  const svg = await readFile(resolve('public', 'favicon.svg'));
  const render = (size: number) =>
    sharp(svg, { density: 72 * (size / 32) })
      .resize(size, size)
      .png();
  await render(512).toFile(join(out, 'icon-512.png'));
  await render(192).toFile(join(out, 'icon-192.png'));
  await render(180).flatten({ background: '#121112' }).toFile(join(out, 'apple-touch-icon.png'));
  const sizes = [32, 16];
  const pngs = await Promise.all(sizes.map(async (size) => ({ size, data: await render(size).toBuffer() })));
  await writeFile(join(out, 'favicon.ico'), ico(pngs));
}

async function ogImages(): Promise<void> {
  const template = await readFile(resolve('media', 'og-template.html'), 'utf8');
  const photo = pathToFileURL(resolve('public', 'assets', 'img', 'kaua-braccio-640.jpg')).href;
  const font = pathToFileURL(resolve('public', 'assets', 'fonts', 'archivo.woff2')).href;
  const aws = profile.certifications.featured.filter((c) => c.issuer === 'Amazon Web Services').length;
  const tmp = await mkdtemp(join(tmpdir(), 'og-'));
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const lang of ['pt', 'en'] as const) {
      const title = profile.person.title;
      const data = {
        title: typeof title === 'string' ? title : title[lang],
        line: 'C# · .NET · AWS Serverless',
        foot: `${profile.person.company} · ${aws}× AWS Certified`,
      };
      const html = template
        .replace('{{PHOTO}}', photo)
        .replace('{{FONT}}', font)
        .replace('{{DATA}}', JSON.stringify(data));
      // setContent não carrega file://, por isso o modelo vira um arquivo temporário
      const file = join(tmp, `og-${lang}.html`);
      await writeFile(file, html);
      await page.goto(pathToFileURL(file).href);
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
      await sharp(png)
        .jpeg({ quality: 86, progressive: true, mozjpeg: true })
        .toFile(join(img, `og-${lang}.jpg`));
    }
  } finally {
    await browser.close();
    await rm(tmp, { recursive: true, force: true });
  }
}

await mkdir(img, { recursive: true });
await portraits();
await icons();
await ogImages();
console.log(`imagens e ícones gerados em ${out}`);
