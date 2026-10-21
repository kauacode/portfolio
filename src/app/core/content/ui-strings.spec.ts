import uiJson from '../../../../content/ui.json';
import { YearMonth } from '../dates';
import { ContentError } from './parse-profile';
import { loadStrings } from './ui-strings';

const strings = loadStrings(uiJson);

describe('UiStrings', () => {
  it('escreve durações em português', () => {
    const pt = strings.pt;
    expect(pt.duration(1)).toBe('1 mês');
    expect(pt.duration(10)).toBe('10 meses');
    expect(pt.duration(12)).toBe('1 ano');
    expect(pt.duration(20)).toBe('1 ano e 8 meses');
  });

  it('escreve durações em inglês', () => {
    const en = strings.en;
    expect(en.duration(1)).toBe('1 month');
    expect(en.duration(24)).toBe('2 years');
    expect(en.duration(20)).toBe('1 year 8 months');
  });

  it('rejeita duração zero', () => {
    expect(() => strings.pt.duration(0)).toThrow(RangeError);
  });

  it('abrevia meses em cada idioma', () => {
    expect(strings.pt.month(new YearMonth(2025, 12))).toBe('dez. 2025');
    expect(strings.en.month(new YearMonth(2025, 12))).toBe('Dec 2025');
  });

  it('preenche valores e acusa o que falta', () => {
    expect(strings.pt.fmt('Concluído em {year}', { year: 2022 })).toBe('Concluído em 2022');
    expect(() => strings.pt.fmt('{nao_existe}', {})).toThrow(/nao_existe/);
  });

  it('exige as mesmas chaves nos dois idiomas', () => {
    const data = structuredClone(uiJson) as Record<'pt' | 'en', Record<string, unknown>>;
    delete data.en['skip'];
    expect(() => loadStrings(data)).toThrow(ContentError);
    expect(() => loadStrings(data)).toThrow(/skip/);
  });
});
