import { rateLimit } from "express-rate-limit";
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
