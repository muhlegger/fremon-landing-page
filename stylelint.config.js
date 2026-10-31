/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-recommended"],
  rules: {
    // O CSS é organizado por seção, e algumas seções são ajustadas mais adiante no arquivo (telas
    // reais do produto, ajustes por breakpoint). Reordenar as regras para satisfazer estas duas
    // mudaria a cascata, então ficam desligadas de propósito.
    "no-descending-specificity": null,
    "no-duplicate-selectors": null,
  },
};
