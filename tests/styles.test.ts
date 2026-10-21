import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const css = [...readFileSync('src/styles.css', 'utf8').matchAll(/@import ['"]\.\/(.+?)['"];/g)]
  .map(([, path]) => readFileSync(join('src', path), 'utf8'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// [texto, fundo]
const PAIRS: [string, string][] = [
  ['ink', 'bg'],
  ['ink-2', 'bg'],
  ['muted', 'bg'],
  ['muted', 'bg-soft'],
  ['ink-2', 'bg-soft'],
  ['green-text', 'bg'],
  ['green-text', 'bg-soft'],
  ['ochre-text', 'bg'],
  ['purple-text', 'bg'],
  ['blue-text', 'bg'],
  ['on-purple', 'field-purple'],
  ['on-purple-2', 'field-purple'],
  ['on-ochre', 'field-ochre'],
  ['on-ochre-2', 'field-ochre'],
  ['on-ochre-btn', 'on-ochre'],
  ['bg', 'ink'],
];

function themes(): Record<'claro' | 'escuro', Record<string, string>> {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const token = /--([\w-]+):\s*(?:light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)|(#[0-9a-f]{6}))/gi;
  for (const [, name, lightValue, darkValue, fixed] of css.matchAll(token)) {
    light[name] = lightValue ?? fixed;
    dark[name] = darkValue ?? fixed;
  }
  return { claro: light, escuro: dark };
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function blocks(prelude: RegExp): [number, number][] {
  return [...css.matchAll(prelude)].map((match) => {
    let i = css.indexOf('{', match.index + match[0].length - 1);
    const start = i;
    for (let depth = 0; ; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) return [start, i];
    }
  });
}

describe('contraste (WCAG 2.2 AA, 4,5:1)', () => {
  it('lê os tokens dos dois temas', () => {
    for (const tokens of Object.values(themes())) assert.ok(Object.keys(tokens).length > 20);
  });

  it('todos os pares de texto e fundo passam nos dois temas', () => {
    const failures = Object.entries(themes()).flatMap(([theme, t]) =>
      PAIRS.filter(([fg, bg]) => contrast(t[fg], t[bg]) < 4.5).map(
        ([fg, bg]) => `${theme}: ${fg} sobre ${bg} = ${contrast(t[fg], t[bg]).toFixed(2)}`,
      ),
    );
    assert.deepEqual(failures, []);
  });
});

describe('movimento', () => {
  it('toda animação fica dentro de @media (prefers-reduced-motion: no-preference)', () => {
    const allowed = blocks(/@media[^{]*prefers-reduced-motion:\s*no-preference[^{]*\{/g);
    const offenders = [...css.matchAll(/(?<![-\w])animation(?:-name)?\s*:(?!\s*none\b)/g)]
      .filter((m) => !allowed.some(([s, e]) => s < m.index && m.index < e))
      .map((m) => css.slice(m.index, m.index + 60));
    assert.deepEqual(offenders, []);
  });

  it('animações ligadas à rolagem só valem onde o navegador as suporta', () => {
    const gated = blocks(/@supports\s*\(animation-timeline:\s*view\(\)\)\s*\{/g);
    for (const m of css.matchAll(/animation-timeline\s*:/g)) {
      const rest = css.slice(m.index);
      if (rest.indexOf('{') < rest.indexOf(';')) continue; // a própria condição do @supports
      assert.ok(
        gated.some(([s, e]) => s < m.index && m.index < e),
        css.slice(m.index, m.index + 50),
      );
    }
  });
});
