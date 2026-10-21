import type uiJson from '../../../../content/ui.json';
import type { YearMonth } from '../dates';
import { ContentError } from './parse-profile';
import { LANGS, type Lang } from './profile.model';

export type UiText = typeof uiJson.pt;
export type SectionKey = keyof UiText['ids'];

export const SECTION_KEYS: readonly SectionKey[] = [
  'about',
  'experience',
  'education',
  'certifications',
  'skills',
  'contact',
];

export class UiStrings {
  constructor(
    readonly lang: Lang,
    readonly text: UiText,
  ) {}

  fmt(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      if (!(key in values)) throw new Error(`falta o valor {${key}} em '${template}'`);
      return String(values[key]);
    });
  }

  month(ym: Pick<YearMonth, 'year' | 'month'>): string {
    return `${this.text.months_short[ym.month - 1]} ${ym.year}`;
  }

  duration(months: number): string {
    if (months < 1) throw new RangeError('duração precisa ser de pelo menos 1 mês');
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const part = (n: number, [one, many]: string[]) => `${n} ${n === 1 ? one : many}`;
    const parts = [
      ...(years ? [part(years, this.text.year)] : []),
      ...(rest ? [part(rest, this.text.month)] : []),
    ];
    return parts.join(this.text.and ? ` ${this.text.and} ` : ' ');
  }
}

export function loadStrings(data: Record<string, unknown>): Record<Lang, UiStrings> {
  const langs = Object.keys(data);
  if (langs.length !== LANGS.length || !LANGS.every((lang) => langs.includes(lang))) {
    throw new ContentError(
      `ui.json: idiomas esperados [${LANGS.join(', ')}], encontrados [${langs.join(', ')}]`,
    );
  }
  const keys = (lang: Lang) => Object.keys(data[lang] as object);
  const diff = [
    ...keys('pt').filter((k) => !keys('en').includes(k)),
    ...keys('en').filter((k) => !keys('pt').includes(k)),
  ];
  if (diff.length)
    throw new ContentError(`ui.json: chaves diferentes entre pt e en: ${diff.sort().join(', ')}`);
  return {
    pt: new UiStrings('pt', data['pt'] as UiText),
    en: new UiStrings('en', data['en'] as UiText),
  };
}
