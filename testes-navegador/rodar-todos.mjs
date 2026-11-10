// Roda todos os roteiros de fluxo, um depois do outro, no ambiente em que
// for chamado (use: node ambiente-e2e.mjs rodar node rodar-todos.mjs), e
// escreve o resumo em todos-resultado.txt.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const ROTEIROS = ["fluxos-busca", "fluxos-login", "fluxos-email", "fluxos-termos", "fluxos-deslize", "fluxos-animais", "fluxos-fotos", "fluxos-conta", "fluxos-validacao", "fluxos-exames", "fluxos-apagar-exame", "fluxos-acesso", "fluxos-atualizacao", "fluxos-abas", "fluxos-erros", "fluxos-celular", "fluxos-celular-2", "fluxos-janelas"];
const resumo = [];
// Uma pausa entre os roteiros: a API limita 300 pedidos por minuto, e todos
// seguidos passam disso (o erro 429 apareceria como falha do site).
const PAUSA_ENTRE = Number(process.env.PAUSA_ENTRE ?? 20000);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [i, r] of ROTEIROS.entries()) {
  if (i > 0) await esperar(PAUSA_ENTRE);
  const inicio = Date.now();
  const s = spawnSync(process.execPath, [`${r}.mjs`], { encoding: "utf8", env: process.env, timeout: 900000 });
  const saida = `${s.stdout}\n${s.stderr}`;
  const falhas = saida.split("\n").filter((l) => /^(FALHOU|FALHA)\b/.test(l.trim()));
  const travou = /Error|TimeoutError/.test(s.stderr) && !/Todas as verificações passaram/.test(s.stdout);
  const linha = `${r}: ${falhas.length === 0 && !travou ? "OK" : "PROBLEMA"} (${Math.round((Date.now() - inicio) / 1000)}s)`;
  resumo.push(linha, ...falhas.map((f) => `    ${f.trim()}`));
  if (travou) resumo.push(`    travou: ${s.stderr.split("\n").find((l) => /Error/.test(l)) ?? ""}`.slice(0, 300));
  writeFileSync(`saida-${r}.txt`, saida);
  writeFileSync("todos-resultado.txt", resumo.join("\n") + "\n");
}
console.log(resumo.join("\n"));
