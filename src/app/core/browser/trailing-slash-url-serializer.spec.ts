import { TrailingSlashUrlSerializer } from './trailing-slash-url-serializer';

describe('TrailingSlashUrlSerializer', () => {
  const serializer = new TrailingSlashUrlSerializer();
  const roundTrip = (url: string) => serializer.serialize(serializer.parse(url));

  it('mantém a barra final das páginas', () => {
    expect(roundTrip('/')).toBe('/');
    expect(roundTrip('/en/')).toBe('/en/');
    expect(roundTrip('/en')).toBe('/en/');
    expect(roundTrip('/en/#experience')).toBe('/en/#experience');
  });

  it('não mexe em caminhos de arquivo (versão offline)', () => {
    expect(roundTrip('/C:/site/kaua-braccio.html')).toBe('/C:/site/kaua-braccio.html');
  });
});
