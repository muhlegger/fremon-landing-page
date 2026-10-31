#!/usr/bin/env node
// Confere se uma URL publicada envia os headers de segurança definidos em vercel.json.
//
//   node scripts/verify-security-headers.mjs [url]     (padrão: https://www.fremon.com.br)
//
// Sem dependências (Node 18+). Sai com código 1 se algo estiver faltando — útil logo após cada deploy.
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "https://www.fremon.com.br").replace(/\/$/, "");
const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

const expected = {};
for (const rule of config.headers ?? []) for (const { key, value } of rule.headers) expected[key.toLowerCase()] = value;

let failures = 0;
const report = (ok, message) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
  if (!ok) failures += 1;
};

const html = await (await fetch(`${base}/`)).text();
const asset = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1];
const targets = [["página", "/"], ...(asset ? [["asset", asset]] : [])];

for (const [name, path] of targets) {
  const response = await fetch(base + path, { redirect: "manual" });
  for (const [key, value] of Object.entries(expected)) {
    const actual = response.headers.get(key);
    report(
      actual === value,
      `${name} ${path} -> ${key}${actual === value ? "" : ` (esperado: ${value} | recebido: ${actual ?? "ausente"})`}`,
    );
  }
}

// Itens que NÃO vêm do vercel.json, mas precisam estar presentes.
const home = await fetch(`${base}/`, { redirect: "manual" });
const hsts = home.headers.get("strict-transport-security") ?? "";
if (base.startsWith("https://")) {
  report(
    /max-age=(\d+)/.test(hsts) && Number(hsts.match(/max-age=(\d+)/)[1]) >= 15552000,
    `HSTS presente (${hsts || "ausente"}) — vem da Vercel, não sobrescrever`,
  );
}

const csp = home.headers.get("content-security-policy") ?? "";
report(!/unsafe-eval/.test(csp), "CSP sem 'unsafe-eval'");
report(!/script-src[^;]*'unsafe-inline'/.test(csp), "CSP: script-src sem 'unsafe-inline'");
report(
  /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'none'/.test(csp),
  "CSP: frame-ancestors, object-src e base-uri fechados",
);

console.log(failures ? `\n${failures} verificação(ões) falharam em ${base}` : `\nTudo certo em ${base}`);
process.exit(failures ? 1 : 0);
