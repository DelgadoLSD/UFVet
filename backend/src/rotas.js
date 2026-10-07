import { Router } from "express";
import {
  cadastrarAnimal,
  editarAnimal,
  excluirAnimal,
  listarAnimais,
} from "./controladores/animais.js";
import {
  atualizarConta,
  encerrarConta,
  trocarSenha,
} from "./controladores/conta.js";
import { consultarConvite } from "./controladores/convites.js";
import {
  entrar,
  sair,
  sairDeTodos,
  sessaoAtual,
} from "./controladores/sessao.js";
import {
  cadastrar,
  conferirDisponibilidade,
} from "./controladores/usuarios.js";
import { exigirLogin } from "./middlewares/sessao.js";

// O cardápio da API: cada linha liga um endereço a quem o atende (o
// controlador), passando antes pelos filtros que ele exige (limite de
// tentativas, login). Todos os endereços começam com /api (ver app.js).
//
// Os nomes seguem o estilo REST: o endereço diz qual coisa (usuários,
// sessão) e o método diz o que fazer com ela (GET consulta, POST cria,
// DELETE apaga).
export function criarRotas(limites) {
  const rotas = Router();

  // Para a hospedagem e o monitoramento saberem que a API está no ar.
  rotas.get("/saude", (req, res) => res.json({ ok: true }));

  // Contas
  rotas.post("/usuarios", limites.cadastro, cadastrar);
  rotas.post(
    "/usuarios/disponibilidade",
    limites.disponibilidade,
    conferirDisponibilidade,
  );
  rotas.get("/convites/:codigo", limites.cadastro, consultarConvite);

  // Sessão (login)
  rotas.get("/sessao", sessaoAtual);
  rotas.post("/sessao", limites.login, entrar);
  rotas.delete("/sessao", sair);
  rotas.delete("/sessoes", exigirLogin, sairDeTodos);

  // A própria conta: dados (F3), senha (F4) e encerramento (F5). Sempre a
  // de quem está logado (ver controladores/conta.js).
  rotas.patch("/conta", exigirLogin, limites.senhaAtual, atualizarConta);
  rotas.put("/conta/senha", exigirLogin, limites.senhaAtual, trocarSenha);
  rotas.delete("/conta", exigirLogin, limites.senhaAtual, encerrarConta);

  // Animais (F8 a F11). Ver é público, como a busca; cadastrar, editar e
  // excluir exigem login, e só o dono mexe (ver controladores/animais.js).
  rotas.get("/usuarios/:codigo/animais", listarAnimais);
  rotas.post("/animais", exigirLogin, limites.cadastroAnimal, cadastrarAnimal);
  rotas.patch("/animais/:codigo", exigirLogin, editarAnimal);
  rotas.delete("/animais/:codigo", exigirLogin, excluirAnimal);

  return rotas;
}
