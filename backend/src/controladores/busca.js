import {
  buscarDoadores as doadoresDaBusca,
  locaisDeDoadores,
} from "../modelos/doador.js";
import {
  DOADORES_POR_PAGINA,
  esquemaBusca,
  esquemaLocais,
} from "../validacao.js";

// Controller (do MVC) da busca de doadores (F16 a F18). Pública, como pede o
// NF16.4: quem procura doador numa emergência nem sempre tem conta. Nada aqui
// leva contato; ele fica no perfil, para quem pode ver.

// GET /api/doadores?especie=CAO&tipos=DEA%201.1-&cidade=...&pagina=2 — uma
// página da busca, com o total, para o site saber se ainda há mais.
export async function buscarDoadores(req, res) {
  const filtros = esquemaBusca.parse(req.query);
  const { total, doadores } = await doadoresDaBusca(filtros);
  res.json({
    doadores,
    total,
    pagina: filtros.pagina,
    porPagina: DOADORES_POR_PAGINA,
  });
}

// GET /api/doadores/locais?especie=CAO — as cidades, cada uma com os
// bairros, onde há doadores da espécie, para os filtros de localização.
export async function listarLocais(req, res) {
  const { especie } = esquemaLocais.parse(req.query);
  res.json({ cidades: await locaisDeDoadores(especie) });
}
