import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  {
    // Os testes rodam no Node, mas os callbacks de page.evaluate rodam no navegador.
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
