import { devices, expect, test } from "@playwright/test";
import { PAGES, renderAllSections } from "./helpers.js";

// 15 resoluções, de celular pequeno a monitor 2K. Celulares e tablets usam emulação de toque.
const VIEWPORTS = [
  [320, 568, "celular pequeno", true],
  [360, 640, "celular Android", true],
  [375, 667, "iPhone SE", true],
  [390, 844, "iPhone 12 a 15", true],
  [414, 896, "celular grande", true],
  [844, 390, "celular na horizontal", true],
  [768, 1024, "tablet na vertical", true],
  [1024, 768, "tablet na horizontal", true],
  [1100, 800, "notebook pequeno", false],
  [1180, 820, "iPad Air na horizontal", true],
  [1280, 800, "notebook", false],
  [1366, 768, "notebook comum", false],
  [1440, 900, "notebook grande", false],
  [1920, 1080, "monitor Full HD", false],
  [2560, 1440, "monitor 2K", false],
];

for (const [width, height, label, touch] of VIEWPORTS) {
  test.describe(`${width}×${height} (${label})`, () => {
    test.use({
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch && width < 1024,
      userAgent: touch ? devices["iPhone 12"].userAgent : undefined,
    });

    for (const { name, path } of PAGES) {
      test(`${name}: sem rolagem lateral, imagem quebrada ou erro de console`, async ({ page }) => {
        const problems = [];
        page.on("console", (message) => message.type() === "error" && problems.push(`console: ${message.text()}`));
        page.on("pageerror", (error) => problems.push(`erro de página: ${error.message}`));
        page.on("requestfailed", (request) => problems.push(`requisição falhou: ${request.url()}`));

        await page.goto(path);
        await renderAllSections(page);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, "rolagem lateral (px além da largura da tela)").toBeLessThanOrEqual(0);

        // Só imagens que ocupam espaço na tela: as de variante oculta (ex.: logo claro/escuro) usam
        // loading="lazy" e o navegador nunca as baixa, o que é esperado.
        const visibleImages = () =>
          page.evaluate(() =>
            [...document.images]
              .filter((img) => img.getClientRects().length > 0 && getComputedStyle(img).visibility !== "hidden")
              .filter((img) => !img.complete || img.naturalWidth === 0)
              .map((img) => img.currentSrc || img.src),
          );
        await expect.poll(visibleImages, { message: "imagens quebradas", timeout: 5000 }).toEqual([]);

        expect(problems, "erros de console e de rede").toEqual([]);
      });
    }
  });
}
