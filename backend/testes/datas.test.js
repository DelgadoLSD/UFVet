import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { banco } from "../src/banco.js";
import { limparBanco } from "./apoio.js";

// Protege a correção de fuso de src/banco.js. O servidor PostgreSQL local
// fica, de propósito, no horário de Brasília: se alguém remover a correção,
// estes testes falham, em vez de os prazos do sistema errarem em silêncio.

beforeEach(limparBanco);
afterAll(() => banco.$disconnect());

describe("datas e fuso horário", () => {
  test("um horário gravado fica guardado no instante certo e volta igual", async () => {
    // preparar: um instante conhecido, meio-dia em UTC
    const meioDia = new Date("2026-01-15T12:00:00.000Z");

    // agir: grava e lê de volta pelo Prisma
    const { id } = await banco.estabelecimento.create({
      data: { nome: "Hospital de teste", cidade: "Viçosa", uf: "MG", criadoEm: meioDia },
    });
    const lido = await banco.estabelecimento.findUniqueOrThrow({ where: { id } });

    // conferir o instante gravado de verdade, lido como texto para não passar
    // pelo adaptador. Só comparar a volta pelo Prisma não basta: sem a
    // correção, o erro acontece na gravação e de novo na leitura, um anula o
    // outro, e o banco guarda 15:00 enquanto o Prisma devolve 12:00.
    const [{ gravado }] = await banco.$queryRaw`
      select to_char(criado_em at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') as gravado
      from estabelecimento where id = ${id}::uuid`;
    expect(gravado).toBe("2026-01-15T12:00:00");
    expect(lido.criadoEm.toISOString()).toBe(meioDia.toISOString());
  });

  test("o 'agora' do banco é o mesmo agora do computador", async () => {
    const [{ agora }] = await banco.$queryRaw`select now() as agora`;

    // Um minuto de folga cobre a demora da consulta; 3 horas, não.
    expect(Math.abs(agora.getTime() - Date.now())).toBeLessThan(60_000);
  });
});
