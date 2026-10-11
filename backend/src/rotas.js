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
  removerFoto,
  trocarFoto,
  trocarSenha,
} from "./controladores/conta.js";
import {
  conferirTutor,
  encerrarLiberacao,
  liberarAcesso,
  listarLiberacoes,
  listarPedidos,
  meuAcesso,
  pedirLiberacao,
  recusarPedido,
  renovarLiberacao,
  veterinariosDoEstabelecimento,
} from "./controladores/acesso.js";
import { buscarDoadores, listarLocais } from "./controladores/busca.js";
import { consultarConvite } from "./controladores/convites.js";
import {
  abrirDocumento,
  apagarVersao,
  enviarDocumento,
} from "./controladores/documentos.js";
import {
  listarEstabelecimentos,
  registrarDoacao,
  registrarObservacao,
  validarAnimal,
} from "./controladores/historico.js";
import { contatoDoPerfil, perfilPublico } from "./controladores/perfis.js";
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
import {
  receberExame,
  receberFoto,
  receberFotos,
} from "./middlewares/envio.js";
import {
  exigirLogin,
  exigirPapel,
  identificarSessao,
} from "./middlewares/sessao.js";

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

  // A própria conta: dados e foto (F3), senha (F4) e encerramento (F5).
  // Sempre a de quem está logado (ver controladores/conta.js). Quem envia
  // arquivo passa antes pelo login e pelo limite de envios: um visitante não
  // chega a mandar nada para a memória da API.
  rotas.patch("/conta", exigirLogin, limites.senhaAtual, atualizarConta);
  rotas.put(
    "/conta/foto",
    exigirLogin,
    limites.envioFotos,
    receberFoto,
    trocarFoto,
  );
  rotas.delete("/conta/foto", exigirLogin, removerFoto);
  rotas.put("/conta/senha", exigirLogin, limites.senhaAtual, trocarSenha);
  rotas.delete("/conta", exigirLogin, limites.senhaAtual, encerrarConta);

  // Busca de doadores (F16 a F18): pública, para quem procura doador numa
  // emergência mesmo sem conta, e sem nenhum contato (NF16.4).
  rotas.get("/doadores", identificarSessao, limites.busca, buscarDoadores);
  rotas.get("/doadores/locais", identificarSessao, limites.busca, listarLocais);

  // O perfil de outra pessoa, aberto pela busca: os dados públicos, para
  // todos, e o contato, só para quem tem acesso (F33), em rota separada.
  rotas.get(
    "/usuarios/:codigo",
    identificarSessao,
    limites.perfis,
    perfilPublico,
  );
  rotas.get(
    "/usuarios/:codigo/contato",
    exigirLogin,
    limites.perfis,
    contatoDoPerfil,
  );

  // Animais (F8 a F11), com as fotos. Ver é público, como a busca (só os
  // arquivos dos exames dependem de quem pede); cadastrar, editar e excluir
  // exigem login, e só o dono mexe (ver controladores/animais.js).
  rotas.get("/usuarios/:codigo/animais", identificarSessao, listarAnimais);
  rotas.post(
    "/animais",
    exigirLogin,
    limites.cadastroAnimal,
    limites.envioFotos,
    receberFotos,
    cadastrarAnimal,
  );
  rotas.patch(
    "/animais/:codigo",
    exigirLogin,
    limites.envioFotos,
    receberFotos,
    editarAnimal,
  );
  rotas.delete("/animais/:codigo", exigirLogin, excluirAnimal);

  // Exames e documentos dos animais (F14 e F15): o dono envia, e cada envio
  // vira uma versão nova; o dono também apaga uma versão que mandou. O
  // arquivo só abre para o dono e para os veterinários (ver
  // controladores/documentos.js).
  rotas.post(
    "/animais/:codigo/documentos/:tipo",
    exigirLogin,
    limites.envioExames,
    receberExame,
    enviarDocumento,
  );
  rotas.get("/documentos/versoes/:id", exigirLogin, abrirDocumento);
  rotas.delete("/documentos/versoes/:id", exigirLogin, apagarVersao);

  // O histórico clínico de um animal, que só o veterinário escreve (F19 a
  // F24): a validação dos critérios, com o tipo sanguíneo, as doações
  // realizadas e as observações sobre a coleta. Ver vem junto com os animais,
  // na rota acima. Nada disso tem rota de alterar ou apagar: o que foi
  // assinado fica como foi feito (ver controladores/historico.js).
  const soVeterinario = [
    exigirLogin,
    exigirPapel("VETERINARIO"),
    limites.registroClinico,
  ];
  rotas.post("/animais/:codigo/validacoes", ...soVeterinario, validarAnimal);
  rotas.post("/animais/:codigo/doacoes", ...soVeterinario, registrarDoacao);
  rotas.post(
    "/animais/:codigo/observacoes",
    ...soVeterinario,
    registrarObservacao,
  );
  // Os hospitais e clínicas, para escolher onde uma coleta foi feita e a
  // que veterinário pedir liberação de contato.
  rotas.get("/estabelecimentos", exigirLogin, listarEstabelecimentos);
  rotas.get(
    "/estabelecimentos/:id/veterinarios",
    exigirLogin,
    veterinariosDoEstabelecimento,
  );

  // Acesso aos contatos dos doadores (F27 a F34). O tutor pede a liberação
  // a um veterinário; o veterinário libera, recusa, renova e encerra, e só
  // mexe no que é dele (ver controladores/acesso.js).
  rotas.get("/acesso", exigirLogin, meuAcesso);
  rotas.post("/pedidos", exigirLogin, limites.pedidosLiberacao, pedirLiberacao);
  const veterinarioDoAcesso = [
    exigirLogin,
    exigirPapel("VETERINARIO"),
    limites.liberacoes,
  ];
  rotas.get("/pedidos", exigirLogin, exigirPapel("VETERINARIO"), listarPedidos);
  rotas.post("/pedidos/:id/recusa", ...veterinarioDoAcesso, recusarPedido);
  rotas.get(
    "/liberacoes",
    exigirLogin,
    exigirPapel("VETERINARIO"),
    listarLiberacoes,
  );
  rotas.post("/liberacoes", ...veterinarioDoAcesso, liberarAcesso);
  rotas.post(
    "/liberacoes/:id/renovacao",
    ...veterinarioDoAcesso,
    renovarLiberacao,
  );
  rotas.delete("/liberacoes/:id", ...veterinarioDoAcesso, encerrarLiberacao);
  // A conferência do tutor antes de liberar (NF28.3).
  rotas.get(
    "/usuarios/:codigo/acesso",
    exigirLogin,
    exigirPapel("VETERINARIO"),
    limites.perfis,
    conferirTutor,
  );

  return rotas;
}
