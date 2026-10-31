# Fremon — landing page

[![Site no ar](https://img.shields.io/badge/site-www.fremon.com.br-002A5E)](https://www.fremon.com.br)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel)

Landing page institucional e comercial do **Fremon**, plataforma de gestão de manutenção
predial para síndicos, feita com a engenharia da FREMASA. Está em produção em
**<https://www.fremon.com.br>**.

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
vite.config.js                   Build: SEO, preload de fontes, poda de mídia
vercel.json                      Headers de segurança e redirecionamentos
```

## Como rodar

Requer Node 20 ou superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o dist/ localmente
```

## Configuração do build

| Variável | Padrão | Em produção |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://www.fremon.com.br` | URL canônica do site |
| `VITE_ROBOTS` | `noindex, nofollow` | `index, follow` |

```bash
VITE_ROBOTS="index, follow" npm run build
```

Dessas variáveis saem o canonical, as tags de compartilhamento, o JSON-LD, o `robots.txt` e
o `sitemap.xml`.

## Segurança

| Header | Função |
| --- | --- |
| `Content-Security-Policy` | Só permite scripts, estilos, imagens e fontes do próprio site; bloqueia iframes, plugins, `<base>` e envio nativo de formulário. |
| `X-Frame-Options` + `frame-ancestors` | Impede que o site seja embutido em outro (clickjacking). |
| `X-Content-Type-Options` | Impede o navegador de "adivinhar" tipos de arquivo. |
| `Referrer-Policy` | Para outros sites, envia só a origem, nunca o caminho. |
| `Permissions-Policy` | Desliga câmera, microfone, geolocalização, USB etc., que a página não usa. |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` | Isola a página e impede que terceiros embutam seus arquivos. |

O HSTS vem da própria Vercel e não é sobrescrito. Ao adicionar algo externo (analytics, fonte,
vídeo, widget), a CSP bloqueia até ser ajustada: inclua o domínio só na diretiva necessária.
Depois de cada deploy:

```bash
node scripts/verify-security-headers.mjs https://www.fremon.com.br
```

O script sai com erro se algum header publicado divergir do `vercel.json`.

## Qualidade

Verificações feitas em 30/10/2026 na versão publicada (Lighthouse 12; no celular, rede 4G lenta
simulada e mediana de três medições). Os números mudam com o conteúdo: use os comandos abaixo
para medir de novo.

| Verificação | Ferramenta | Resultado |
| --- | --- | --- |
| Cabeçalhos de segurança | Mozilla HTTP Observatory | A+ (12 de 12 testes) |
| Configuração publicada x `vercel.json` | `scripts/verify-security-headers.mjs` | 20 de 20 itens |
| Dependências | `npm audit` | Nenhuma vulnerabilidade conhecida |
| Recursos de terceiros | Análise das requisições da página | Nenhum |
| Desempenho | Lighthouse | Computador 100, celular 98 |
| Acessibilidade, boas práticas e SEO | Lighthouse | 100 nas três categorias, no celular e no computador |
| Acessibilidade (WCAG 2.2 A e AA) | axe-core, com todas as seções renderizadas | Nenhuma violação nas 3 páginas |
| Layout | Chromium automatizado, 15 resoluções de 320 a 2560 px | Sem rolagem lateral, imagem quebrada ou erro de console |

Métricas do Lighthouse:

| Métrica | Celular | Computador | Limite recomendado |
| --- | --- | --- | --- |
| First Contentful Paint | 1,2 s | 0,3 s | até 1,8 s |
| Largest Contentful Paint | 2,4 s | 0,5 s | até 2,5 s |
| Total Blocking Time | 30 ms | 0 ms | até 200 ms |
| Cumulative Layout Shift | 0 | 0 | até 0,1 |
| Peso da página | 276 KB | 335 KB | n/a |
| Requisições | 11 | 13 | n/a |

No celular o LCP fica perto do limite: o maior elemento é o título, que é redesenhado quando
a fonte da marca termina de carregar na rede 4G simulada.

Para reproduzir:

```bash
npm audit
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
