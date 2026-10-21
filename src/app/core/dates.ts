export class YearMonth {
  private static readonly pattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

  constructor(
    readonly year: number,
    readonly month: number,
  ) {}

  static parse(value: string): YearMonth {
    const match = YearMonth.pattern.exec(value);
    if (!match) throw new RangeError(`data inválida '${value}'; use AAAA-MM`);
    return new YearMonth(Number(match[1]), Number(match[2]));
  }

  static of(date: Date): YearMonth {
    return new YearMonth(date.getFullYear(), date.getMonth() + 1);
  }

  get index(): number {
    return this.year * 12 + (this.month - 1);
  }

  iso(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}`;
  }
}

export class CalendarDate {
  private static readonly pattern = /^(\d{4})-(\d{2})-(\d{2})$/;

  private constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {}

  static parse(value: string): CalendarDate {
    const match = CalendarDate.pattern.exec(value);
    const [year, month, day] = match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (!match || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
      throw new RangeError(`data inválida '${value}'; use AAAA-MM-DD`);
    }
    return new CalendarDate(year, month, day);
  }

  get yearMonth(): YearMonth {
    return new YearMonth(this.year, this.month);
  }

  iso(): string {
    return `${this.yearMonth.iso()}-${String(this.day).padStart(2, '0')}`;
  }

  isAfter(other: CalendarDate): boolean {
    return this.iso() > other.iso();
  }
}

/** `end = null` significa até hoje. */
export class Period {
  constructor(
    readonly start: YearMonth,
    readonly end: YearMonth | null,
  ) {
    if (end && end.index < start.index) {
      throw new RangeError(`período termina antes de começar: ${start.iso()} → ${end.iso()}`);
    }
  }

  get isCurrent(): boolean {
    return this.end === null;
  }

  resolvedEnd(today: Date): YearMonth {
    return this.end ?? YearMonth.of(today);
  }

  /** Conta o mês inicial e o final, como o LinkedIn. */
  months(today: Date): number {
    return this.resolvedEnd(today).index - this.start.index + 1;
  }

  monthIndexes(today: Date): number[] {
    const first = this.start.index;
    return Array.from({ length: this.months(today) }, (_, i) => first + i);
  }
}

export function unionMonths(periods: Iterable<Period>, today: Date): number {
  const covered = new Set<number>();
  for (const period of periods) period.monthIndexes(today).forEach((i) => covered.add(i));
  return covered.size;
}

export function wholeYearsSince(start: YearMonth, today: Date): number {
  return Math.floor((YearMonth.of(today).index - start.index) / 12);
}
