import profileJson from '../../../../content/profile.json';
import { ContentError, parseProfile } from './parse-profile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = (): any => structuredClone(profileJson);

function expectInvalid(json: unknown, fragment: string): void {
  expect(() => parseProfile(json)).toThrow(ContentError);
  expect(() => parseProfile(json)).toThrow(fragment);
}

describe('parseProfile', () => {
  it('aceita o conteúdo real', () => {
    const profile = parseProfile(data());
    expect(profile.person.name).toBe('Kauã Braccio');
    expect(profile.experience[0].roles[0].period.isCurrent).toBe(true);
    expect(profile.experience[0].displayName).toBe('CI&T');
  });

  it('aponta o campo sem tradução', () => {
    const json = data();
    delete json.hero.lede.en;
    expectInvalid(json, '$.hero.lede');
  });

  it('aponta a data inválida', () => {
    const json = data();
    json.experience[0].roles[0].start = 'dez/2025';
    expectInvalid(json, 'experience[0].roles[0].start');
  });

  it('exige experiências da mais recente para a mais antiga', () => {
    const json = data();
    json.experience.reverse();
    expectInvalid(json, 'mais recente');
  });

  it('aceita só um cargo atual', () => {
    const json = data();
    json.experience[1].roles[0].end = null;
    expectInvalid(json, 'mais de um cargo atual');
  });

  it('rejeita cor fora da paleta', () => {
    const json = data();
    json.experience[0].color = 'pink';
    expectInvalid(json, 'color');
  });

  it('rejeita formação que termina antes de começar', () => {
    const json = data();
    json.education[0].end = 2020;
    expectInvalid(json, 'education[0].end');
  });

  it('exige validade posterior à emissão', () => {
    const json = data();
    json.certifications.featured[0].expires = '2020-01-01';
    expectInvalid(json, 'featured[0].expires');
  });

  it('rejeita itens que não são texto em listas de texto', () => {
    const json = data();
    json.person.alternate_names.push(42);
    expectInvalid(json, 'alternate_names');
  });

  it('exige links https', () => {
    const json = data();
    json.certifications.featured[0].url = 'http://example.com';
    expectInvalid(json, 'https://');
  });
});
