// Datas sem hora (nascimento, coleta) na API.
//
// No banco, essas colunas são do tipo date, e o Prisma as entrega como um
// Date à meia-noite em UTC (o banco trabalha em UTC, ver banco.js). Na API e
// no site, elas viajam como texto "AAAA-MM-DD", sem fuso: o dia 20/08 é o dia
// 20/08 em qualquer lugar.

// O dia de hoje no horário de Brasília, mesmo com o servidor em outro fuso:
// às 22h em Viçosa, em UTC já é o dia seguinte.
export const hojeISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

// "2021-08-20" -> Date, para gravar numa coluna date.
export const paraDataDoBanco = (dia) => new Date(`${dia}T00:00:00.000Z`);

// Date lido de uma coluna date -> "2021-08-20".
export const deDataDoBanco = (data) => data.toISOString().slice(0, 10);

// A data existe no calendário? "2026-02-30" não existe.
export function dataExiste(dia) {
  if (typeof dia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    return false;
  }
  const data = paraDataDoBanco(dia);
  return !Number.isNaN(data.getTime()) && deDataDoBanco(data) === dia;
}

// "2026-10-07" menos 3 anos -> "2023-10-07". O 29/02 vira 28/02 num ano que
// não tem esse dia.
export function subtrairAnos(dia, anos) {
  const [ano, mes, diaDoMes] = dia.split("-").map(Number);
  const alvo = ano - anos;
  const ultimoDiaDoMes = new Date(Date.UTC(alvo, mes, 0)).getUTCDate();
  const doisDigitos = (n) => String(n).padStart(2, "0");
  return `${alvo}-${doisDigitos(mes)}-${doisDigitos(Math.min(diaDoMes, ultimoDiaDoMes))}`;
}

// "2025-08-10" mais 1 ano -> "2026-08-10" (o prazo de uma validação).
export const somarAnos = (dia, anos) => subtrairAnos(dia, -anos);
