import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES, renderAllSections } from "./helpers.js";

// WCAG 2.2, níveis A e AA, com todas as seções renderizadas.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const { name, path } of PAGES) {
  test(`${name}: sem violações de acessibilidade (axe-core)`, async ({ page }) => {
    await page.goto(path);
    await renderAllSections(page);
    // Espera as animações de entrada terminarem: o axe mede o contraste com a opacidade atual,
    // então um texto no meio da transição pareceria sem contraste.
    await page.waitForTimeout(1500);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(
      violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} elemento(s), ex.: ${v.nodes[0].target.join(" ")}`,
      ),
    ).toEqual([]);
  });
}
