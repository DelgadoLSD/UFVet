import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { registrar } from "../registro.js";

// Limites de tentativas por endereço de rede (rate limit). Barram quem tenta
// adivinhar senhas, robôs criando contas em massa e quem dispara pedidos sem
// parar. Os números deixam folga para uso normal: numa sessão de testes no
// hospital, várias pessoas dividem o mesmo Wi-Fi e chegam à API pelo mesmo
// endereço.
//
// Os contadores ficam na memória da API e zeram quando ela reinicia, o que
// basta para um servidor só. Cada chamada de criarLimites cria contadores
// novos (os testes usam isso para começar do zero).

const MINUTO = 60 * 1000;

const opcoesComuns = {
  // Avisa o navegador, nos cabeçalhos da resposta, quanto falta para liberar.
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next, opcoes) => {
    registrar("limite_atingido", { caminho: req.path, ip: req.ip });
    res.status(opcoes.statusCode).json(opcoes.message);
  },
};

// Quem está logado tem a própria cota, pela conta; o visitante, pelo
// endereço de rede. Assim, várias pessoas no mesmo Wi-Fi (da UFV, de um
// hospital) não gastam a cota umas das outras. O ipKeyGenerator agrupa os
// endereços IPv6 de um mesmo aparelho, que mudam com frequência.
const porContaOuEndereco = (req) =>
  req.usuario ? `conta:${req.usuario.id}` : ipKeyGenerator(req.ip);

export function criarLimites() {
  return {
    // Toda a API.
    geral: rateLimit({
      ...opcoesComuns,
      windowMs: MINUTO,
      limit: 300,
      message: {
        erro: "Muitos pedidos em pouco tempo. Espere um minuto e tente de novo.",
      },
    }),

    // Login: só as tentativas erradas contam, então quem acerta a senha
    // nunca é barrado.
    login: rateLimit({
      ...opcoesComuns,
      windowMs: 15 * MINUTO,
      limit: 20,
      skipSuccessfulRequests: true,
      message: {
        erro: "Muitas tentativas de entrar sem sucesso. Espere 15 minutos e tente de novo.",
      },
    }),

    // Cadastro e consulta de convite.
    cadastro: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 30,
      message: {
        erro: "Muitos cadastros feitos daqui em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Mudanças confirmadas com a senha atual: trocar o e-mail ou a senha e
    // encerrar a conta. Quem encontrar um computador com a conta aberta
    // poderia tentar adivinhar a senha por aqui. Só as senhas erradas contam
    // (o controlador marca res.locals.senhaRecusada), e a conta é a chave,
    // porque só chega aqui quem está logado. Pedidos sem senha (trocar só o
    // telefone, por exemplo) nem passam pelo limite.
    senhaAtual: rateLimit({
      ...opcoesComuns,
      windowMs: 15 * MINUTO,
      limit: 10,
      skip: (req) => req.body?.senhaAtual === undefined,
      keyGenerator: (req) => req.usuario.id,
      skipSuccessfulRequests: true,
      requestWasSuccessful: (req, res) => !res.locals.senhaRecusada,
      message: {
        erro: "Muitas tentativas com a senha errada. Espere 15 minutos e tente de novo.",
      },
    }),

    // Cadastro de animais, por conta: folga para quem cuida de muitos
    // animais, e um teto para quem tentasse encher o banco.
    cadastroAnimal: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 30,
      keyGenerator: (req) => req.usuario.id,
      message: {
        erro: "Muitos animais cadastrados em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Envios de fotos, por conta: tratar uma imagem custa processamento, e
    // o limite barra quem tentasse ocupar a API com envios em sequência. Só
    // contam os pedidos que trazem arquivo (mudar a disponibilidade, por
    // exemplo, não).
    envioFotos: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 60,
      skip: (req) => !req.is("multipart/form-data"),
      keyGenerator: (req) => req.usuario.id,
      message: {
        erro: "Muitas fotos enviadas em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Validações, doações e observações, por conta de veterinário: folga
    // para um plantão movimentado, e um teto para quem tentasse encher o
    // histórico de um animal com registros em sequência.
    registroClinico: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 60,
      keyGenerator: (req) => req.usuario.id,
      message: {
        erro: "Muitos registros feitos em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Pedidos de liberação de contato, por conta de tutor. Quem precisa
    // pede uma vez e espera a resposta (só um pedido pendente por vez); o
    // teto barra quem pedisse e cancelasse em sequência para incomodar
    // veterinários.
    pedidosLiberacao: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 10,
      keyGenerator: (req) => req.usuario.id,
      message: {
        erro: "Muitos pedidos de liberação em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Liberar, recusar, renovar e encerrar, por conta de veterinário: folga
    // para um plantão movimentado.
    liberacoes: rateLimit({
      ...opcoesComuns,
      windowMs: 60 * MINUTO,
      limit: 60,
      keyGenerator: (req) => req.usuario.id,
      message: {
        erro: "Muitas liberações feitas em pouco tempo. Tente de novo mais tarde.",
      },
    }),

    // Busca de doadores e perfis, abertos a quem não tem conta (NF16.4).
    // Contam por conta, ou por endereço para o visitante. Quem procura doador
    // de verdade faz algumas buscas por minuto (o site espera a pessoa parar
    // de mexer nos filtros antes de buscar); o teto barra quem tentasse
    // copiar a lista inteira de doadores, página por página, ou percorrer os
    // perfis um a um.
    busca: rateLimit({
      ...opcoesComuns,
      windowMs: MINUTO,
      limit: 60,
      keyGenerator: porContaOuEndereco,
      message: {
        erro: "Muitas buscas em pouco tempo. Espere um minuto e tente de novo.",
      },
    }),
    perfis: rateLimit({
      ...opcoesComuns,
      windowMs: MINUTO,
      limit: 60,
      keyGenerator: porContaOuEndereco,
      message: {
        erro: "Muitos perfis abertos em pouco tempo. Espere um minuto e tente de novo.",
      },
    }),

    // Conferência de e-mail e CPF durante o cadastro. Responde se um e-mail
    // tem conta, então o limite barra quem tentaria testar uma lista inteira.
    // Um cadastro normal faz poucas conferências.
    disponibilidade: rateLimit({
      ...opcoesComuns,
      windowMs: 15 * MINUTO,
      limit: 60,
      message: {
        erro: "Muitas conferências feitas daqui em pouco tempo. Espere 15 minutos e tente de novo.",
      },
    }),
  };
}
