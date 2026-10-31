import { defineConfig } from "@playwright/test";

// Por padrão os testes rodam contra o build local (vite preview): testam o código do commit e
// não geram tráfego no domínio do cliente. O CI usa sempre esse modo.
const PORT = 4173;

// Para medir o site publicado, rode à mão: BASE_URL=https://www.fremon.com.br npm test
const REMOTE = process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: REMOTE ?? `http://localhost:${PORT}` },
  webServer: REMOTE
    ? undefined
    : {
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
