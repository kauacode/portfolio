# Portfólio · Kauã Braccio

Site pessoal de Kauã Braccio, Engenheiro de Software, feito em **Angular 22** e publicado como site estático. Tem versões em português e inglês, tema claro e escuro, e todo o conteúdo chega pronto no HTML. A identidade visual, chamada **Mural**, usa as cores e formas do mural da fotografia.

| Rota   | Idioma                             |
| ------ | ---------------------------------- |
| `/`    | Português (principal, `x-default`) |
| `/en/` | Inglês                             |

## Decisões de arquitetura

O portfólio não tem login, formulário nem dados que mudam por visita, então não tem backend: o Angular pré-renderiza cada página no build (SSG) e o navegador recebe HTML completo, que depois é hidratado.

- **Pré-renderização + hidratação.** As rotas `/`, `/en/` e a 404 viram HTML estático no `ng build` (`outputMode: "static"`). O conteúdo está no HTML entregue, o que é o melhor cenário para SEO, leitores de tela e prévias de link. Ao carregar, o Angular hidrata a página sem redesenhá-la.
- **Angular atual.** Componentes standalone, signals (`signal`, `computed`, `input`), detecção de mudanças sem zone.js, `OnPush` em todos os componentes e o controle de fluxo novo (`@if`, `@for`, `@switch`).
- **Componentes com seletor de atributo** (`section[appHero]`, `a[appCvLink]`). O elemento semântico é o próprio host do componente, sem invólucro extra: o HTML final é o mesmo do design, e o CSS segue simples (`.section + .section`).
- **Conteúdo separado da apresentação.** Textos e dados ficam em `content/*.json`, importados no build e validados em TypeScript. Um JSON errado falha com o caminho exato do campo, por exemplo `$.experience[0].roles[1].start: data inválida 'dez/2025'; use AAAA-MM`, em vez de gerar uma página quebrada.
- **Dados derivados, não copiados.** Os anos de experiência, a contagem de certificações AWS, a duração de cada cargo e o tempo de uso de cada tecnologia são calculados a partir das datas. A página pré-renderizada usa a data do build; no navegador, os mesmos componentes recalculam com a data da visita.
- **Idioma por página.** Cada rota fornece o próprio `Locale` (idioma + textos de `ui.json`). Trocar de idioma leva à mesma seção na outra versão (`#experiencia` → `#experience`).
- **Fonte servida pelo próprio site.** Archivo variável (peso e largura) em WOFF2 com subset latino, em `public/assets/fonts/` junto com a licença OFL. O arquivo saiu de `Archivo[wdth,wght].ttf` (repositório google/fonts, `ofl/archivo`) com `pyftsubset` em Basic Latin, Latin-1 e pontuação tipográfica (– − × · “ ”), mantendo os eixos de peso e largura. Não há requisição a terceiros.
- **Segurança.** CSP sem `unsafe-inline` para scripts: os scripts embutidos (tema e hidratação) são liberados por hash SHA-256, calculado depois do build e gravado em `_headers`.
- **Peso.** Cerca de 94 KB de JavaScript e 6 KB de CSS transferidos (comprimidos). Imagens responsivas em AVIF, WebP e JPEG.

## Estrutura

```
content/
  profile.json            experiências, formação, certificações, competências (pt e en lado a lado)
  ui.json                 textos de interface por idioma
src/
  index.html              <head> comum e o script que aplica o tema salvo antes da primeira pintura
  styles.css              design system: importa os arquivos de styles/ na ordem certa
  styles/                 tokens, base, cabeçalho, botões, hero, seções, contato, rodapé, movimento
  app/
    core/
      content/            modelo tipado, validação do JSON e textos de interface
      dates.ts            YearMonth, Period, durações e união de períodos
      i18n/locale.ts      idioma da página, textos e ids das seções
      seo/                <title>, meta, Open Graph, hreflang e JSON-LD
      browser/            tema, seção ativa, navegação entre idiomas, arquivos (online/offline)
    layout/               cabeçalho e rodapé
    sections/             hero, sobre, experiência, formação, certificações, competências, contato
    shared/               forma do mural, ícones, link externo, currículo, período
    pages/                página do portfólio e 404
public/                   arquivos publicados como estão: fotos, fonte, currículo, ícones
media/                    originais que não são publicados: foto original e modelo da imagem OG
scripts/
  postbuild.ts            404.html, _headers (CSP), sitemap, robots e manifest
  offline.ts              versão em arquivo único
  assets.ts               retratos, ícones e imagens OG (sharp + Chrome)
  shots.ts                capturas de QA
tests/                    testes da saída do build e das regras do CSS (node:test)
```

## Desenvolvimento

Requer Node.js 24 ou superior.

```bash
npm install
```

```bash
npm start
```

Depois do último comando, abra http://localhost:4200. Para conferir tudo o que o CI confere:

```bash
npm run check
```

| Comando             | O que faz                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `npm run build`     | pré-renderiza as páginas em `dist/` e completa com 404, CSP, sitemap, robots e manifest   |
| `npm test`          | testes unitários e de componentes (Vitest)                                                |
| `npm run test:dist` | testes da saída do build, das regras do CSS e da versão offline (depois do build)         |
| `npm run lint`      | ESLint com as regras do Angular, incluindo acessibilidade dos templates                   |
| `npm run typecheck` | tipos dos scripts e testes em Node                                                        |
| `npm run offline`   | build + `offline/kaua-braccio.html`, o site inteiro num arquivo que abre com dois cliques |
| `npm run assets`    | regenera retratos, ícones e imagens de compartilhamento (quando a foto mudar)             |
| `npm run shots`     | capturas de página inteira em `.qa/` (PT e EN, 1440/768/390 px, claro e escuro)           |

Os scripts em `scripts/` e os testes em `tests/` são TypeScript executado direto pelo Node, sem etapa de compilação. `assets` e `shots` usam o Chrome instalado na máquina.

A versão offline é a página em português com CSS, JavaScript, fonte, fotos e currículo embutidos. O app percebe que está offline e troca de idioma no próprio documento, mantendo a seção em que o leitor estava.

### O que os testes cobrem

- Datas e durações, incluindo a contagem inclusiva igual à do LinkedIn e a união de períodos sobrepostos.
- Textos de interface: plurais, formatação e chaves iguais nos dois idiomas.
- Validação do conteúdo: tradução ausente, data inválida, ordem cronológica, mais de um cargo atual, cor desconhecida e links sem https.
- Componentes: fatos derivados, textos traduzidos, ids únicos, âncoras e ARIA válidos, hierarquia de títulos, currículo de outro idioma sinalizado, GitHub oculto por padrão, links externos e imagens.
- Saída do build: conteúdo no HTML estático, SEO e JSON-LD, arquivos referenciados existentes, CSP compatível com os scripts embutidos, cache dos arquivos, sitemap, robots, manifest e 404.
- Versão offline: nada é buscado fora do arquivo, e os arquivos que o app usa ao trocar de idioma estão embutidos.
- CSS: contraste WCAG AA de todos os pares de cor de texto nos dois temas, e toda animação respeita "reduzir movimento".

## Editando o conteúdo

Tudo fica em `content/profile.json`. Cada texto aceita `{"pt": "...", "en": "..."}` ou uma string igual nos dois idiomas. Datas usam `AAAA-MM`, e o cargo atual tem `"end": null`.

- **Novo cargo:** adicione no início de `roles` da empresa e feche o anterior com `end`.
- **Nova certificação:** adicione em `certifications.featured`, com o link do Credly, ou em `others`.
- **Stack principal:** em `skills.core`. O campo `match` lista os nomes da `stack` dos cargos que contam como uso daquela tecnologia. As demais ficam agrupadas em `skills.groups`.
- **Currículo em inglês:** coloque o PDF em `public/assets/docs/` e preencha `person.cv.en`. Enquanto estiver `null`, a página em inglês aponta para o PDF em português e informa isso a leitores de tela.
- **GitHub:** fica oculto por padrão. Use `"show_github": true` para mostrar.

## Deploy

Antes do primeiro deploy, defina o domínio final em `site.url` (`content/profile.json`). Ele é usado em canonical, hreflang, Open Graph, sitemap e JSON-LD. O valor atual, `https://kauabraccio.dev`, é provisório. O site usa caminhos absolutos, então deve ser servido na raiz de um domínio.

| Plataforma       | Configuração                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Cloudflare Pages | build `npm run build`, saída `dist`, variável `NODE_VERSION=24`. O `_headers` é aplicado.            |
| Netlify          | já configurado em `netlify.toml`. O `_headers` é aplicado.                                           |
| GitHub Pages     | workflow `.github/workflows/pages.yml` (fonte "GitHub Actions", domínio próprio). Não lê `_headers`. |

O workflow `.github/workflows/ci.yml` roda lint, tipos, formatação, testes, build e os testes da saída a cada push e pull request.

Depois de publicar:

1. Cadastre o domínio no Google Search Console e envie `sitemap.xml`.
2. Atualize a prévia do link no LinkedIn Post Inspector.
3. Coloque a URL do site no perfil do LinkedIn.
4. Rode o Lighthouse (Chrome DevTools) nas duas páginas.

## Licença

O código está sob a licença [MIT](LICENSE). Fotos, currículo, textos de `content/` e a identidade visual são de uso exclusivo de Kauã Braccio e não estão cobertos pela licença. A fonte Archivo segue a licença OFL.
