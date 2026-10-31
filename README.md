# Fremon — landing page

[![Site no ar](https://img.shields.io/badge/site-www.fremon.com.br-002A5E)](https://www.fremon.com.br)
[![CI](https://github.com/muhlegger/fremon-landing-page/actions/workflows/ci.yml/badge.svg)](https://github.com/muhlegger/fremon-landing-page/actions/workflows/ci.yml)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel)

Landing page institucional e comercial do **Fremon**, plataforma de gestão de manutenção
predial para síndicos, feita com a engenharia da FREMASA. Está em produção em
**<https://www.fremon.com.br>**.

> **English summary:** production landing page for Fremon, a building-maintenance platform for
> Brazilian condominium managers. Semantic HTML, CSS and vanilla JavaScript built with Vite; strict
> Content Security Policy and security headers checked after every deploy; technical SEO generated at
> build time; layout tests at 15 viewports and axe-core accessibility checks in CI. Code shared with
> the client's permission (all rights reserved).

![Capa da landing page do Fremon](docs/capa.jpg)

> Projeto desenvolvido para um cliente e publicado com autorização dele. Marca, textos e
> imagens pertencem ao Fremon e à FREMASA; ver [LICENSE](./LICENSE).

## Destaques técnicos

- **Sem framework de UI.** HTML semântico, CSS e JavaScript nativos; o Vite cuida só do
  build. O resultado é uma página estática, leve e fácil de auditar.
- **Segurança em camadas.** CSP restritiva (`default-src 'none'`), `frame-ancestors 'none'`,
  `Permissions-Policy`, COOP/CORP e demais headers definidos em [`vercel.json`](./vercel.json),
  com um [script que confere o site publicado contra essa configuração](./scripts/verify-security-headers.mjs).
- **SEO técnico gerado no build.** Canonical, Open Graph, `robots.txt` e `sitemap.xml` saem de
  duas variáveis de ambiente; dados estruturados em JSON-LD (`Organization`, `WebSite`,
  `SoftwareApplication`, `FAQPage`).
- **Falha fechada para previews.** Sem as variáveis de produção, a página sai com
  `noindex, nofollow` e `Disallow: /`, então um preview nunca concorre com o site oficial.
- **Mídia enxuta.** Imagens WebP responsivas (`srcset`) e um plugin do build que remove do
  `dist` qualquer arquivo de mídia que nenhuma página publicada referencie.
- **Desempenho percebido.** Pré-carregamento da imagem principal e das fontes variáveis
  (Manrope e Source Serif 4, self-hosted), para o texto aparecer cedo.
- **Favicon completo.** `favicon.ico` (16/32/48 px), PNGs em múltiplos de 48 px e SVG, no
  formato que o Google exige para exibir a marca nos resultados de busca.
- **Acessibilidade.** Contraste de rótulos e números em destaque revisado e títulos
  estruturados por seção.

## Estrutura

```
index.html                       Landing page
politica-de-privacidade/         Páginas legais
termos-de-servico/
src/final.css, final.js          Estilos e comportamento da landing
src/legal.js                     Comportamento das páginas legais
public/                          Mídia, favicon e arquivos servidos como estão
scripts/verify-security-headers.mjs   Confere os headers do site publicado
tests/                           Testes de layout (15 resoluções) e acessibilidade (axe-core)
.github/workflows/ci.yml         CI: npm audit, lint, build e testes
eslint.config.js, stylelint.config.js, .prettierrc.json   Lint e formatação
vite.config.js                   Build: SEO, preload de fontes, poda de mídia
vercel.json                      Headers de segurança e redirecionamentos
```

## Como rodar

Requer Node 20.19+, 22.13+ ou 24 (o `.nvmrc` indica a 24, a mesma usada na Vercel e no CI).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o dist/ localmente
npm test           # build + testes de layout e acessibilidade (Playwright)
npm run lint       # ESLint, Stylelint e verificação do Prettier
npm run format     # formata JS, CSS, JSON, Markdown e YAML (o HTML é formatado à mão)
```

Na primeira vez, `npx playwright install chromium` baixa o navegador usado nos testes.

## Configuração do build

| Variável        | Padrão                      | Em produção          |
| --------------- | --------------------------- | -------------------- |
| `VITE_SITE_URL` | `https://www.fremon.com.br` | URL canônica do site |
| `VITE_ROBOTS`   | `noindex, nofollow`         | `index, follow`      |

```bash
VITE_ROBOTS="index, follow" npm run build
```

Dessas variáveis saem o canonical, as tags de compartilhamento, o JSON-LD, o `robots.txt` e
o `sitemap.xml`.

## Segurança

| Header                                                        | Função                                                                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                                     | Só permite scripts, estilos, imagens e fontes do próprio site; bloqueia iframes, plugins, `<base>` e envio nativo de formulário. |
| `X-Frame-Options` + `frame-ancestors`                         | Impede que o site seja embutido em outro (clickjacking).                                                                         |
| `X-Content-Type-Options`                                      | Impede o navegador de "adivinhar" tipos de arquivo.                                                                              |
| `Referrer-Policy`                                             | Para outros sites, envia só a origem, nunca o caminho.                                                                           |
| `Permissions-Policy`                                          | Desliga câmera, microfone, geolocalização, USB etc., que a página não usa.                                                       |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` | Isola a página e impede que terceiros embutam seus arquivos.                                                                     |

O HSTS vem da própria Vercel e não é sobrescrito. Ao adicionar algo externo (analytics, fonte,
vídeo, widget), a CSP bloqueia até ser ajustada: inclua o domínio só na diretiva necessária.
Depois de cada deploy:

```bash
node scripts/verify-security-headers.mjs https://www.fremon.com.br
```

O script sai com erro se algum header publicado divergir do `vercel.json`.

## Testes e qualidade

O CI ([`ci.yml`](./.github/workflows/ci.yml)) roda a cada push: `npm audit`, `npm run lint`, build e
`npm test`. Os testes (Playwright + axe-core) rodam contra o build local; contra o site publicado, só
quando rodados à mão com `BASE_URL`:

- **Layout:** as 3 páginas em 15 resoluções, de 320 a 2560 px, com emulação de toque nos celulares
  e tablets. Falham se houver rolagem lateral, imagem quebrada, erro de console ou requisição
  que falhe.
- **Acessibilidade:** axe-core com WCAG 2.2 A e AA, uma análise por seção, com a seção na tela e movimento
  reduzido. As seções usam `content-visibility: auto`, e o axe trata como invisível o que o navegador não
  desenhou: uma análise única da página deixaria essas seções sem verificação.

As medições abaixo foram feitas em 31/10/2026 no site publicado, depois da limpeza do CSS e da
correção dos rótulos (o CI não repete medições no site publicado). Lighthouse 13.6; no celular, rede 4G lenta
simulada e mediana de três medições. Os números variam entre execuções: use os comandos abaixo
para medir de novo.

| Verificação                            | Ferramenta                                            | Resultado                                           |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Cabeçalhos de segurança                | Mozilla HTTP Observatory                              | A+ (12 de 12 testes)                                |
| Configuração publicada x `vercel.json` | `scripts/verify-security-headers.mjs`                 | 20 de 20 itens                                      |
| Dependências                           | `npm audit`                                           | Nenhuma vulnerabilidade conhecida                   |
| Desempenho                             | Lighthouse                                            | Computador 100, celular 100 (mediana; 98 a 100)     |
| Acessibilidade, boas práticas e SEO    | Lighthouse                                            | 100 nas três categorias, no celular e no computador |
| Acessibilidade (WCAG 2.2 A e AA)       | axe-core, seção por seção, com a seção na tela        | Nenhuma violação nas 3 páginas                      |
| Layout                                 | Chromium automatizado, 15 resoluções de 320 a 2560 px | 48 testes sem falhas (inclui axe)                   |

Métricas do Lighthouse:

| Métrica                  | Celular | Computador | Limite recomendado |
| ------------------------ | ------- | ---------- | ------------------ |
| First Contentful Paint   | 1,1 s   | 0,3 s      | até 1,8 s          |
| Largest Contentful Paint | 1,1 s   | 0,5 s      | até 2,5 s          |
| Total Blocking Time      | 71 ms   | 0 ms       | até 200 ms         |
| Cumulative Layout Shift  | 0       | 0          | até 0,1            |
| Peso da página           | 272 KB  | 331 KB     | n/a                |
| Requisições              | 11      | 13         | n/a                |

O Total Blocking Time no celular oscilou entre 58 e 143 ms nas três medições; todas ficaram
dentro do limite.

Para reproduzir:

```bash
npm audit
BASE_URL=https://www.fremon.com.br npm test      # layout e axe-core no site publicado
node scripts/verify-security-headers.mjs https://www.fremon.com.br
npx lighthouse https://www.fremon.com.br --preset=desktop --view
npx lighthouse https://www.fremon.com.br --view          # perfil de celular (padrão)
```

O Observatory roda em <https://developer.mozilla.org/en-US/observatory>.

## Deploy

Hospedado na Vercel (preset Vite). Os headers só valem se o `vercel.json` estiver na pasta de
onde o deploy é feito. O `vercel.json` também redireciona o domínio de preview para o
definitivo e os sitemaps antigos do WordPress para `/sitemap.xml`.

## Autor

Gustavo Muhlegger
