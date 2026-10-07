import { ErroApi } from "../erros.js";
import { acharConviteValido } from "../modelos/convite.js";
import { registrar } from "../registro.js";
import { campos } from "../validacao.js";

// Controller (do MVC) dos convites de veterinário.

// GET /api/convites/:codigo — confere um convite antes do fim do cadastro,
// para o site mostrar de quem é e onde a pessoa vai atuar. O cadastro confere
// tudo de novo: esta consulta é só um aviso antecipado.
export async function consultarConvite(req, res) {
  const codigo = campos.convite.safeParse(req.params.codigo);
  const convite = codigo.success ? await acharConviteValido(codigo.data) : null;
  if (!convite) {
    registrar("convite_recusado", { ip: req.ip });
    throw new ErroApi(
      404,
      "Convite inválido, já usado ou vencido. Peça um novo à direção do hospital.",
    );
  }
  res.json({
    convite: {
      nome: convite.nome,
      crmv: convite.crmv,
      ufCrmv: convite.ufCrmv,
      estabelecimento: convite.estabelecimento.nome,
      expiraEm: convite.expiraEm,
    },
  });
}
