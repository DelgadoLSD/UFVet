import { cpfValido, telefoneValido } from "../util/texto";

// Regras da conta de usuário, as mesmas no cadastro e na página da conta. O
// site confere só para avisar a pessoa antes de enviar: a API confere tudo de
// novo (backend/src/validacao.js).

// Tamanho mínimo da senha.
export const TAMANHO_MINIMO_SENHA = 8;

export const PREENCHA = "Preencha este campo.";

const digitos = (texto = "") => texto.replace(/\D/g, "");

// Cada conferência abaixo devolve a mensagem do problema, ou undefined quando
// o dado está certo.

export function erroNome(nome = "") {
  const limpo = nome.trim();
  if (!limpo) return PREENCHA;
  if (!limpo.includes(" ")) return "Informe o nome e o sobrenome.";
}

export function erroCpf(cpf = "") {
  if (digitos(cpf).length !== 11) return "O CPF tem 11 números.";
  if (!cpfValido(cpf)) return "CPF inválido. Confira os números.";
}

export function erroEmail(email = "") {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um e-mail válido.";
}

export function erroTelefone(telefone = "") {
  if (digitos(telefone).length < 10) return "Informe o telefone com DDD.";
  if (!telefoneValido(telefone)) {
    return "Telefone inválido. Confira o DDD e o número.";
  }
}

// { campo: mensagem } só com os campos que têm problema.
export const soComProblema = (erros) =>
  Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem));
