import { Router } from "express";
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

  return rotas;
}
