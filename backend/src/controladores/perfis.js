import { codigoDoEndereco } from "../codigos.js";
import { ErroApi } from "../erros.js";
import {
  buscarUsuarioPorCodigo,
  contatoDe,
  dadosPublicos,
  podeVerContato,
} from "../modelos/usuario.js";

// Controller (do MVC) do perfil de outra pessoa, aberto pela busca: os dados
// públicos, que qualquer um vê, e o contato, que só quem tem acesso vê (F33).
// São duas rotas de propósito: o contato nunca viaja junto com o perfil.

async function pessoaDoEndereco(req) {
  const usuario = await buscarUsuarioPorCodigo(
    codigoDoEndereco(req.params.codigo),
  );
  if (!usuario) throw new ErroApi(404, "Pessoa não encontrada.");
  return usuario;
}

// GET /api/usuarios/:codigo — o perfil público.
export async function perfilPublico(req, res) {
  res.json({ usuario: await dadosPublicos(await pessoaDoEndereco(req)) });
}

// GET /api/usuarios/:codigo/contato — o e-mail e o telefone, só para quem
// pode ver (ver podeVerContato). A resposta não fica guardada em cache: é
// dado pessoal, e o acesso de um tutor vence.
export async function contatoDoPerfil(req, res) {
  const dono = await pessoaDoEndereco(req);
  if (!(await podeVerContato(req.usuario, dono))) {
    throw new ErroApi(
      403,
      "O contato aparece quando um veterinário libera o seu acesso. Peça a liberação a quem acompanha o seu caso.",
    );
  }
  res.set("Cache-Control", "no-store");
  res.json({ contato: contatoDe(dono) });
}
