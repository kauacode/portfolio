import { CalendarDate, Period, YearMonth } from '../dates';
import {
  COLORS,
  type Certification,
  type Color,
  type Company,
  type Education,
  LANGS,
  type Profile,
  type Role,
  type Text,
} from './profile.model';

// A mensagem traz o caminho do campo, ex.: $.experience[0].roles[1].start
export class ContentError extends Error {
  override readonly name = 'ContentError';
}

const EDUCATION_STATUS = ['in_progress', 'completed'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFilled = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

class Reader {
  constructor(
    readonly data: unknown,
    readonly path = '$',
  ) {}

  fail(message: string, key?: string): ContentError {
    return new ContentError(`${key ? `${this.path}.${key}` : this.path}: ${message}`);
  }

  child(key: string): Reader {
    if (!isRecord(this.data) || !(key in this.data)) throw this.fail('campo obrigatório ausente', key);
    return new Reader(this.data[key], `${this.path}.${key}`);
  }

  optional(key: string): Reader | null {
    if (!isRecord(this.data)) throw this.fail('esperado um objeto');
    const value = this.data[key];
    return value === undefined || value === null ? null : new Reader(value, `${this.path}.${key}`);
  }

  items(key: string): Reader[] {
    const node = this.child(key);
    if (!Array.isArray(node.data)) throw node.fail('esperada uma lista');
    return node.data.map((value, i) => new Reader(value, `${node.path}[${i}]`));
  }

  string(key: string): string {
    const value = this.child(key).data;
    if (!isFilled(value)) throw this.fail('esperado texto não vazio', key);
    return value;
  }

  optString(key: string): string | null {
    return this.optional(key) ? this.string(key) : null;
  }

  integer(key: string): number {
    const value = this.child(key).data;
    if (!Number.isInteger(value)) throw this.fail('esperado número inteiro', key);
    return value as number;
  }

  boolean(key: string): boolean {
    const value = this.child(key).data;
    if (typeof value !== 'boolean') throw this.fail('esperado true ou false', key);
    return value;
  }

  text(key: string): Text {
    return this.child(key).asText();
  }

  optText(key: string): Text | null {
    return this.optional(key)?.asText() ?? null;
  }

  strings(key: string): string[] {
    const values = this.items(key).map((node) => node.data);
    if (!values.every(isFilled)) throw this.fail('esperada uma lista de textos não vazios', key);
    return values;
  }

  texts(key: string): Text[] {
    return this.items(key).map((node) => node.asText());
  }

  /** Aceita {"pt": ..., "en": ...} ou um texto igual nos dois idiomas. */
  asText(): Text {
    const data = this.data;
    if (isFilled(data)) return { pt: data, en: data };
    if (
      isRecord(data) &&
      Object.keys(data).length === LANGS.length &&
      LANGS.every((lang) => isFilled(data[lang]))
    ) {
      return { pt: data['pt'] as string, en: data['en'] as string };
    }
    throw this.fail('esperado texto ou {"pt": ..., "en": ...} com os dois idiomas preenchidos');
  }

  choice<T extends string>(key: string, allowed: readonly T[]): T {
    const value = this.string(key);
    if (!allowed.includes(value as T))
      throw this.fail(`valor '${value}' fora de [${allowed.join(', ')}]`, key);
    return value as T;
  }

  color(key = 'color'): Color {
    return this.choice(key, COLORS);
  }

  url(key: string): string {
    const value = this.string(key);
    if (!value.startsWith('https://')) throw this.fail('URL deve começar com https://', key);
    return value;
  }

  optUrl(key: string): string | null {
    return this.optional(key) ? this.url(key) : null;
  }

  yearMonth(key: string): YearMonth {
    return this.parse(key, YearMonth.parse);
  }

  optYearMonth(key: string): YearMonth | null {
    return this.optional(key) ? this.yearMonth(key) : null;
  }

  date(key: string): CalendarDate {
    return this.parse(key, CalendarDate.parse);
  }

  optDate(key: string): CalendarDate | null {
    return this.optional(key) ? this.date(key) : null;
  }

  private parse<T>(key: string, parser: (raw: string) => T): T {
    const raw = this.string(key);
    try {
      return parser(raw);
    } catch (error) {
      throw this.fail((error as Error).message, key);
    }
  }
}

const newestFirst = (starts: YearMonth[]) =>
  starts.every((s, i) => i === 0 || s.index <= starts[i - 1].index);

function role(r: Reader): Role {
  let period: Period;
  try {
    period = new Period(r.yearMonth('start'), r.optYearMonth('end'));
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw r.fail((error as Error).message);
  }
  return {
    title: r.text('title'),
    type: r.text('type'),
    period,
    summary: r.optText('summary'),
    bullets: r.texts('bullets'),
    stack: r.texts('stack'),
  };
}

function company(r: Reader): Company {
  const roles = r.items('roles').map(role);
  if (!roles.length) throw r.fail('empresa sem cargos', 'roles');
  if (!newestFirst(roles.map((x) => x.period.start))) {
    throw r.fail('cargos devem estar do mais recente para o mais antigo', 'roles');
  }
  const start = roles.reduce(
    (min, x) => (x.period.start.index < min.index ? x.period.start : min),
    roles[0].period.start,
  );
  const ends = roles.map((x) => x.period.end);
  const end = ends.includes(null)
    ? null
    : (ends as YearMonth[]).reduce((max, e) => (e.index > max.index ? e : max));
  const name = r.string('company');
  const short = r.optString('short');
  return {
    name,
    short,
    displayName: short ?? name,
    url: r.optUrl('url'),
    color: r.color(),
    location: r.text('location'),
    period: new Period(start, end),
    roles,
  };
}

function education(r: Reader): Education {
  const start = r.integer('start');
  const end = r.integer('end');
  if (end < start) throw r.fail(`termina (${end}) antes de começar (${start})`, 'end');
  return {
    kind: r.text('kind'),
    degree: r.text('degree'),
    school: r.string('school'),
    short: r.string('short'),
    location: r.string('location'),
    start,
    end,
    inProgress: r.choice('status', EDUCATION_STATUS) === 'in_progress',
    schedule: r.optText('schedule'),
    color: r.color(),
    summary: r.optText('summary'),
    topics: r.texts('topics'),
  };
}

function certification(r: Reader): Certification {
  const issued = r.date('issued');
  const expires = r.optDate('expires');
  if (expires && !expires.isAfter(issued))
    throw r.fail('validade precisa ser posterior à emissão', 'expires');
  return {
    name: r.string('name'),
    issuer: r.string('issuer'),
    code: r.optString('code'),
    issued,
    expires,
    url: r.url('url'),
    color: r.color(),
    note: r.optText('note'),
  };
}

export function parseProfile(data: unknown): Profile {
  const root = new Reader(data);
  const site = root.child('site');
  const person = root.child('person');
  const meta = root.child('meta');
  const hero = root.child('hero');
  const about = root.child('about');
  const certs = root.child('certifications');
  const skills = root.child('skills');

  const cv = person.child('cv');
  if (!isRecord(cv.data) || !isFilled(cv.data['pt'])) {
    throw cv.fail('esperado {"pt": "caminho.pdf", "en": null | "caminho.pdf"}');
  }
  const cvData = cv.data;

  const experience = root.items('experience').map(company);
  if (!newestFirst(experience.map((c) => c.period.start))) {
    throw root.fail('experiências devem estar da mais recente para a mais antiga', 'experience');
  }
  if (experience.flatMap((c) => c.roles).filter((x) => x.period.isCurrent).length > 1) {
    throw root.fail('há mais de um cargo atual (end: null)', 'experience');
  }

  const name = person.string('name');
  return {
    site: {
      url: site.url('url').replace(/\/+$/, ''),
      showGithub: site.boolean('show_github'),
      updated: site.yearMonth('updated'),
    },
    person: {
      name,
      fullName: person.string('full_name'),
      givenName: name.split(' ')[0],
      familyName: name.split(' ').at(-1) ?? name,
      alternateNames: person.strings('alternate_names'),
      title: person.text('title'),
      company: person.string('company'),
      companyUrl: person.url('company_url'),
      locality: person.string('locality'),
      region: person.string('region'),
      area: person.text('area'),
      countryCode: person.string('country_code'),
      email: person.string('email'),
      linkedin: person.url('linkedin'),
      github: person.url('github'),
      cv: { pt: cvData['pt'] as string, en: isFilled(cvData['en']) ? cvData['en'] : null },
      careerStart: person.yearMonth('career_start'),
    },
    meta: { title: meta.text('title'), description: meta.text('description'), ogAlt: meta.text('og_alt') },
    hero: { lede: hero.text('lede'), sector: hero.text('sector') },
    about: {
      paragraphs: about.texts('paragraphs'),
      focus: about
        .items('focus')
        .map((f) => ({ color: f.color(), title: f.text('title'), text: f.text('text') })),
    },
    experience,
    education: root.items('education').map(education),
    languages: root
      .items('languages')
      .map((x) => ({ name: x.text('name'), level: x.text('level'), color: x.color() })),
    certifications: certs.items('featured').map(certification),
    courses: certs.items('others').map((c) => ({ name: c.text('name'), issuer: c.string('issuer') })),
    coreSkills: skills.items('core').map((s) => ({
      name: s.string('name'),
      match: s.strings('match'),
      detail: s.optText('detail'),
    })),
    skillGroups: skills.items('groups').map((g) => ({ title: g.text('title'), items: g.texts('items') })),
  };
}
