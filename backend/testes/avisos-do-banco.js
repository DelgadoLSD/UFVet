import { afterEach, expect } from "vitest";

// O driver do Postgres avisa quando uma consulta chega a uma conexão que ainda
// está respondendo outra, como várias buscas ao mesmo tempo dentro de uma
// transação. Hoje ele as põe numa fila; a próxima versão vai recusar. Aqui o
// aviso vira falha no teste em que apareceu.
const avisos = [];
process.on("warning", (aviso) => {
  if (aviso.message.includes("already executing a query")) {
    avisos.push(aviso.message);
  }
});

afterEach(() => {
  expect(
    avisos.splice(0),
    "duas consultas ao mesmo tempo na mesma conexão do banco",
  ).toEqual([]);
});
