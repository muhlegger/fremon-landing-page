import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";

// SEO: a URL pública e a indexação vêm do ambiente. Em produção, a Vercel define
// VITE_SITE_URL=https://www.fremon.com.br e VITE_ROBOTS="index, follow"; sem elas (build local ou
// de preview), a página sai sem indexação — falhar fechado é mais seguro que indexar um preview.
// robots.txt e sitemap.xml saem dos mesmos valores no build.
const SEO_DEFAULTS = {
  VITE_SITE_URL: "https://www.fremon.com.br",
  VITE_ROBOTS: "noindex, nofollow",
};

// Páginas publicadas: [entrada do build, caminho público, prioridade no sitemap].
const PAGES = [
  ["main", "index.html", "/", "1.0"],
  ["privacidade", "politica-de-privacidade/index.html", "/politica-de-privacidade/", "0.3"],
  ["termos", "termos-de-servico/index.html", "/termos-de-servico/", "0.3"],
];

function seo(env) {
  const siteUrl = env.VITE_SITE_URL.replace(/\/+$/, "");
  const indexable = !/noindex/i.test(env.VITE_ROBOTS);
  let outDir = "";

  return {
    name: "fremon-seo",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.replaceAll("%VITE_SITE_URL%", siteUrl).replaceAll("%VITE_ROBOTS%", env.VITE_ROBOTS),
    },
    closeBundle() {
      const robots = indexable
        ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
        : "# Preview: não indexar. Em produção, defina VITE_ROBOTS=\"index, follow\" no build.\nUser-agent: *\nDisallow: /\n";
      const urls = PAGES.map(
        ([, , path, priority]) =>
          `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
      ).join("\n");
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      writeFileSync(join(outDir, "robots.txt"), robots);
      writeFileSync(join(outDir, "sitemap.xml"), sitemap);
    },
  };
}

// O título e o texto de cada página dependem das duas fontes principais (o título do topo usa
// as duas). Sem pré-carregamento, o navegador só as descobre depois de ler o CSS; com ele, elas
// chegam junto com o CSS e o texto aparece mais cedo. Os nomes têm hash, então saem do bundle.
const PRELOAD_FONTS = [/^assets\/manrope-latin-wght-normal-[\w-]+\.woff2$/, /^assets\/source-serif-4-latin-wght-normal-[\w-]+\.woff2$/];

function preloadFonts() {
  return {
    name: "fremon-preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (html, ctx) => {
        const files = Object.keys(ctx.bundle ?? {}).filter((name) => PRELOAD_FONTS.some((pattern) => pattern.test(name)));
        return files.map((file) => ({
          tag: "link",
          attrs: { rel: "preload", href: `/${file}`, as: "font", type: "font/woff2", crossorigin: "" },
          injectTo: "head-prepend",
        }));
      },
    },
  };
}

// Tudo o que está em public/ entra no build, mas as fotos e telas usadas só pelas páginas de
// estudo não precisam ir ao ar (algumas são imagens geradas sem o rótulo "ilustrativa").
// Depois do build, sai do dist toda mídia que nenhuma página publicada referencia no HTML,
// CSS ou JS. Uma imagem montada por concatenação no JS seria removida: referencie o caminho inteiro.
const MEDIA_DIRS = ["assets/brand", "assets/og", "assets/photos", "assets/product"];

function publishOnlyUsedMedia() {
  let outDir = "";

  return {
    name: "fremon-only-used-media",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const built = readdirSync(join(outDir, "assets")).filter((file) => /\.(css|js)$/.test(file));
      const text = [...PAGES.map(([, file]) => file), ...built.map((file) => join("assets", file))]
        .map((file) => readFileSync(join(outDir, file), "utf8"))
        .join("\n");

      for (const dir of MEDIA_DIRS) {
        for (const entry of readdirSync(join(outDir, dir), { recursive: true, withFileTypes: true })) {
          if (!entry.isFile()) continue;
          const file = join(entry.parentPath, entry.name);
          const url = `/${relative(outDir, file).split(sep).join("/")}`;
          if (!text.includes(url)) rmSync(file);
        }
      }
    },
  };
}

// O build de produção publica a landing page e as páginas legais (Política de Privacidade e
// Termos de Serviço, nos mesmos endereços do site anterior). As páginas de estudo —
// prototipo/, concepts/, comparison/ e premium-concept/ — continuam abertas no `npm run dev`,
// mas não vão para o ar: duas delas usam script/estilo inline, que a CSP do vercel.json
// bloqueia, e nenhuma deve ser indexada.
export default defineConfig(({ mode }) => {
  const env = { ...SEO_DEFAULTS, ...loadEnv(mode, process.cwd(), "VITE_") };

  return {
    plugins: [seo(env), preloadFonts(), publishOnlyUsedMedia()],
    build: {
      rollupOptions: {
        input: Object.fromEntries(PAGES.map(([name, file]) => [name, fileURLToPath(new URL(`./${file}`, import.meta.url))])),
      },
    },
  };
});
