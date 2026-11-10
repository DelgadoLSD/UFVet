// Gera os arquivos que os roteiros enviam ao site, na pasta imagens-teste:
// fotos de cores lisas (uma com localização GPS, que o servidor precisa
// apagar), um GIF (formato recusado), um PDF de verdade (um laudo de
// mentira) e dois arquivos disfarçados (texto com nome de .jpg e de .pdf).
// Os arquivos já vêm prontos no repositório; este script só é preciso se
// eles forem apagados. Usa o sharp do back-end e o Edge.
// Uso: node gerar-arquivos-teste.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const PASTA = fileURLToPath(new URL("imagens-teste/", import.meta.url));
const sharp = createRequire(new URL("../backend/package.json", import.meta.url))("sharp");
mkdirSync(PASTA, { recursive: true });

const cor = (r, g, b, w = 900, h = 700) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } });
await cor(183, 16, 42)
  .jpeg()
  .withExif({
    IFD0: { Make: "Celular de teste" },
    IFD3: { GPSLatitudeRef: "S", GPSLatitude: "20/1 45/1 14/1" },
  })
  .toFile(PASTA + "vermelha-com-gps.jpg");
await cor(30, 120, 200).png().toFile(PASTA + "azul.png");
await cor(40, 160, 90).jpeg().toFile(PASTA + "verde.jpg");
await cor(200, 160, 40, 60, 40).gif().toFile(PASTA + "amarela.gif");
writeFileSync(PASTA + "disfarcada.jpg", "isto não é uma imagem");
writeFileSync(PASTA + "falso.pdf", "<html><script>alert(1)</script></html>");

const nav = await chromium.launch({ channel: "msedge" });
const p = await nav.newPage();
await p.setContent(`<html><body style="font-family:Arial;padding:40px">
<h1 style="color:#9e0a24">Laboratório de Teste</h1>
<h2>Sorologias: Zeus</h2>
<p>Babesia: negativo<br>Ehrlichia: negativo<br>Anaplasma: negativo<br>Leishmania: negativo</p>
<p style="color:#666">Documento gerado para os testes do UFVet.</p></body></html>`);
await p.pdf({ path: PASTA + "sorologia-teste.pdf", format: "A4" });
await nav.close();
console.log("arquivos de teste gerados em imagens-teste/");
