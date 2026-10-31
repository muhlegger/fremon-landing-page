import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "./helpers.js";

// WCAG 2.2, níveis A e AA.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// As seções usam content-visibility: auto: o navegador não desenha as que estão longe da tela,
// e o axe trata o conteúdo delas como invisível, sem verificar nada. Por isso cada bloco
// (cabeçalho, cada filho do <main> e rodapé) é analisado com ele na tela, depois que as
// animações de entrada terminam. Uma análise final da página inteira cobre o que fica fora
// desses blocos (link de pular, barra fixa do celular).
const blocksOf = (page) =>
  page.evaluate(() => [
    "body > header",
    ...[...document.querySelectorAll("main > *")].map((_, i) => `main > :nth-child(${i + 1})`),
    "body > footer",
  ]);

// O axe mede o contraste com as cores do momento: um texto no meio de uma transição pareceria
// sem contraste, e a rolagem dispara entradas e o filme do "Memória do prédio" a todo instante.
// Com movimento reduzido (o site respeita a preferência) a página fica nos estados finais, os
// mesmos que o visitante vê quando cada animação termina.
test.use({ reducedMotion: "reduce" });

const settle = async (page) => {
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations !== Infinity) animation.finish();
    }
  });
};

for (const { name, path } of PAGES) {
  test(`${name}: sem violações de acessibilidade (axe-core)`, async ({ page }) => {
    // Uma análise por bloco, cada uma esperando as animações: a landing leva bem mais que 30 s.
    test.setTimeout(120_000);
    await page.goto(path);
    const problems = new Map();
    const analyze = async (builder) => {
      const { violations } = await builder.withTags(TAGS).analyze();
      for (const v of violations)
        for (const node of v.nodes)
          problems.set(
            `${v.id} ${node.target.join(" ")}`,
            `${v.id} (${v.impact}): ${v.help} — ${node.target.join(" ")}`,
          );
    };

    for (const block of await blocksOf(page)) {
      await page.evaluate((selector) => document.querySelector(selector).scrollIntoView({ block: "start" }), block);
      await settle(page);
      await analyze(new AxeBuilder({ page }).include(block));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await analyze(new AxeBuilder({ page }));

    expect([...problems.values()]).toEqual([]);
  });
}
