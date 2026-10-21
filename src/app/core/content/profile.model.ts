import { CalendarDate, Period, YearMonth } from '../dates';

export const LANGS = ['pt', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const COLORS = ['blue', 'ochre', 'green', 'purple'] as const;
export type Color = (typeof COLORS)[number];

export type Text = Readonly<Record<Lang, string>>;

export interface Site {
  readonly url: string;
  readonly showGithub: boolean;
  readonly updated: YearMonth;
}

export interface Person {
  readonly name: string;
  readonly fullName: string;
  readonly givenName: string;
  readonly familyName: string;
  readonly alternateNames: readonly string[];
  readonly title: Text;
  readonly company: string;
  readonly companyUrl: string;
  readonly locality: string;
  readonly region: string;
  readonly area: Text;
  readonly countryCode: string;
  readonly email: string;
  readonly linkedin: string;
  readonly github: string;
  readonly cv: { readonly pt: string; readonly en: string | null };
  readonly careerStart: YearMonth;
}

export interface Meta {
  readonly title: Text;
  readonly description: Text;
  readonly ogAlt: Text;
}

export interface Hero {
  readonly lede: Text;
  readonly sector: Text;
}

export interface Focus {
  readonly color: Color;
  readonly title: Text;
  readonly text: Text;
}

export interface About {
  readonly paragraphs: readonly Text[];
  readonly focus: readonly Focus[];
}

export interface Role {
  readonly title: Text;
  readonly type: Text;
  readonly period: Period;
  readonly summary: Text | null;
  readonly bullets: readonly Text[];
  readonly stack: readonly Text[];
}

export interface Company {
  readonly name: string;
  readonly short: string | null;
  readonly displayName: string;
  readonly url: string | null;
  readonly color: Color;
  readonly location: Text;
  readonly period: Period;
  readonly roles: readonly Role[];
}

export interface Education {
  readonly kind: Text;
  readonly degree: Text;
  readonly school: string;
  readonly short: string;
  readonly location: string;
  readonly start: number;
  readonly end: number;
  readonly inProgress: boolean;
  readonly schedule: Text | null;
  readonly color: Color;
  readonly summary: Text | null;
  readonly topics: readonly Text[];
}

export interface Language {
  readonly name: Text;
  readonly level: Text;
  readonly color: Color;
}

export interface Certification {
  readonly name: string;
  readonly issuer: string;
  readonly code: string | null;
  readonly issued: CalendarDate;
  readonly expires: CalendarDate | null;
  readonly url: string;
  readonly color: Color;
  readonly note: Text | null;
}

export interface Course {
  readonly name: Text;
  readonly issuer: string;
}

export interface CoreSkill {
  readonly name: string;
  /** Nomes da stack dos cargos que contam como uso desta competência. */
  readonly match: readonly string[];
  readonly detail: Text | null;
}

export interface SkillGroup {
  readonly title: Text;
  readonly items: readonly Text[];
}

export interface Profile {
  readonly site: Site;
  readonly person: Person;
  readonly meta: Meta;
  readonly hero: Hero;
  readonly about: About;
  readonly experience: readonly Company[];
  readonly education: readonly Education[];
  readonly languages: readonly Language[];
  readonly certifications: readonly Certification[];
  readonly courses: readonly Course[];
  readonly coreSkills: readonly CoreSkill[];
  readonly skillGroups: readonly SkillGroup[];
}

export function usesSkill(role: Role, skill: CoreSkill): boolean {
  return role.stack.some((item) => skill.match.includes(item.pt));
}
