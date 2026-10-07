import bcrypt from "bcryptjs";

// Senhas viram hash bcrypt (NF1.1): um embaralhado de mão única, que serve
// para conferir a senha, nunca para lê-la de volta. O bcrypt mistura um
// trecho aleatório (sal) em cada senha e é lento de propósito, o que torna
// inviável testar milhões de senhas contra um banco vazado.

// Custo 10 é o mínimo recomendado pela OWASP. Cada ponto a mais dobra o
// tempo; acima disso, o login demoraria vários segundos nos servidores
// gratuitos, que são lentos. Nos testes o custo cai para 4, só para rodarem
// rápido.
const CUSTO = process.env.NODE_ENV === "test" ? 4 : 10;

// O bcrypt só considera os primeiros 72 bytes da senha; a validação recusa
// senhas maiores, para nenhuma parte digitada ser ignorada em silêncio.
export const BYTES_MAXIMOS_SENHA = 72;

export const gerarHashSenha = (senha) => bcrypt.hash(senha, CUSTO);

// Hash de uma senha que ninguém tem. Quando o e-mail digitado não existe, a
// senha é conferida contra ele mesmo assim: a resposta leva o mesmo tempo nos
// dois casos, e quem tenta descobrir e-mails cadastrados pelo tempo de
// resposta não descobre nada (NF2.2).
const HASH_DE_NINGUEM = bcrypt.hashSync("senha-de-ninguem", CUSTO);

export const conferirSenha = (senha, hash) =>
  bcrypt.compare(senha, hash ?? HASH_DE_NINGUEM);
