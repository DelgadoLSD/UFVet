import { chamarApi } from "./api";

// Os links que o UFVet manda por e-mail: confirmar o e-mail (no cadastro e
// na troca de e-mail), mandar o link de confirmação de novo e criar uma
// senha nova. Os erros chegam como ErroApi; o de link que não vale mais vem
// com o código "LINK_INVALIDO".

// Devolve { email, troca, jaConfirmado }.
export const confirmarEmail = (codigo) =>
  chamarApi("/email/confirmacao", { metodo: "POST", corpo: { codigo } });

// A API responde igual tendo ou não um cadastro esperando com esse e-mail.
export const reenviarConfirmacao = (email) =>
  chamarApi("/email/reenvio", { metodo: "POST", corpo: { email } });

// Também responde igual tendo ou não uma conta com esse e-mail.
export const pedirSenhaNova = (email) =>
  chamarApi("/senha/esqueci", { metodo: "POST", corpo: { email } });

// Devolve { email }, o da conta, para a página de entrar já trazê-lo.
export const criarSenhaNova = (codigo, senha) =>
  chamarApi("/senha/nova", { metodo: "POST", corpo: { codigo, senha } });

// Corrige o e-mail de um cadastro que ainda não foi confirmado, no navegador
// em que ele foi feito (a API reconhece o cadastro por um cookie próprio).
// Devolve { email, enviado }, como o cadastro. Fora desse navegador, ou
// depois de 24 horas, o erro vem com o código "SEM_CADASTRO".
export const corrigirEmailDoCadastro = (email) =>
  chamarApi("/email/correcao", { metodo: "POST", corpo: { email } });
