import { CalendarDate, Period, YearMonth, unionMonths, wholeYearsSince } from './dates';

const TODAY = new Date(2026, 9, 20); // 20/10/2026

describe('YearMonth', () => {
  it('lê AAAA-MM e ordena pelo índice', () => {
    expect(YearMonth.parse('2025-03')).toEqual(new YearMonth(2025, 3));
    expect(YearMonth.parse('2024-12').index).toBeLessThan(YearMonth.parse('2025-01').index);
    expect(YearMonth.parse('2025-03').iso()).toBe('2025-03');
  });

  it.each(['2025-13', '2025-3', '25-03', '2025/03', ''])('rejeita %j', (value) => {
    expect(() => YearMonth.parse(value)).toThrow(RangeError);
  });
});

describe('CalendarDate', () => {
  it('lê AAAA-MM-DD e compara', () => {
    expect(CalendarDate.parse('2026-10-15').iso()).toBe('2026-10-15');
    expect(CalendarDate.parse('2029-10-15').isAfter(CalendarDate.parse('2026-10-15'))).toBe(true);
  });

  it('rejeita datas que não existem', () => {
    expect(() => CalendarDate.parse('2026-02-30')).toThrow(RangeError);
  });
});

describe('Period', () => {
  it('conta os meses de forma inclusiva, como o LinkedIn', () => {
    // LinkedIn mostra "mar. 2025 - dez. 2025 · 10 meses"
    expect(new Period(new YearMonth(2025, 3), new YearMonth(2025, 12)).months(TODAY)).toBe(10);
  });

  it('usa a data de hoje no período em andamento', () => {
    expect(new Period(new YearMonth(2025, 12), null).months(TODAY)).toBe(11);
  });

  it('rejeita período que termina antes de começar', () => {
    expect(() => new Period(new YearMonth(2025, 5), new YearMonth(2025, 4))).toThrow(RangeError);
  });

  it('soma vários períodos sem contar a sobreposição duas vezes', () => {
    const periods = [
      new Period(new YearMonth(2025, 3), new YearMonth(2025, 12)),
      new Period(new YearMonth(2025, 12), null),
    ];
    expect(unionMonths(periods, TODAY)).toBe(20); // mar. 2025 → out. 2026
  });

  it('conta anos inteiros', () => {
    expect(wholeYearsSince(new YearMonth(2024, 3), TODAY)).toBe(2);
    expect(wholeYearsSince(new YearMonth(2024, 11), TODAY)).toBe(1);
  });
});
