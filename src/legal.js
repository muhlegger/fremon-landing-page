// Páginas legais (Política de Privacidade e Termos de Serviço): as fontes e o CSS do site,
// e o ano do rodapé. Nenhuma demonstração interativa roda aqui.
import "@fontsource-variable/manrope";
import "@fontsource-variable/source-serif-4";
import "./final.css";

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
