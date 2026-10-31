// Páginas publicadas e utilitários compartilhados pelos testes.
export const PAGES = [
  { name: "landing", path: "/" },
  { name: "política de privacidade", path: "/politica-de-privacidade/" },
  { name: "termos de serviço", path: "/termos-de-servico/" },
];

// Rola a página de cima a baixo, devagar, para que as seções desenhadas só quando chegam
// perto da tela (IntersectionObserver) existam no DOM antes das verificações.
export async function renderAllSections(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    // Força o download das imagens com loading="lazy" que a rolagem rápida não alcançou,
    // para o teste de imagem quebrada não depender do tempo de carregamento.
    for (const img of document.images) img.loading = "eager";
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
}
