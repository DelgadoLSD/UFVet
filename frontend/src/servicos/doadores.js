import { chamarApi } from "./api";

// Busca de doadores na API (F16 a F18). A tela monta a consulta com os
// filtros e a página (ver pages/busca/filtros.js); a API devolve só aquela
// página, de 6 em 6, com o total, para a tela saber se ainda há mais. A busca
// é pública e nunca traz contatos.

// { doadores, total, pagina, porPagina }
export const buscarDoadores = (consulta) => chamarApi(`/doadores?${consulta}`);

// As cidades onde há doadores da espécie, cada uma com os bairros:
// [{ nome: "Viçosa - MG", bairros: ["Centro", "Ramos"] }].
export async function listarLocais(especie) {
  const { cidades } = await chamarApi(
    `/doadores/locais?especie=${encodeURIComponent(especie)}`,
  );
  return cidades;
}
