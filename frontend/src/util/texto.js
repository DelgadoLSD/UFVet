// Pequenas regras de texto usadas em várias telas. Ficam juntas para que uma
// mudança de redação (por exemplo, como o site trata uma pessoa) seja feita
// num lugar só.

export const primeiroNome = (nome) => nome.trim().split(/\s+/)[0];

// "ela" -> "Ela", para o começo de uma frase.
export const maiuscula = (texto) =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

// "32 kg", "4,5 kg"
export const formatarPeso = (kg) => `${kg.toLocaleString("pt-BR")} kg`;

// CPF formatado enquanto a pessoa digita: só números, no máximo 11, com os
// pontos e o traço entrando sozinhos ("12345678" -> "123.456.78").
export function formatarCpf(texto) {
  return texto
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

// Confere os dois dígitos verificadores, a mesma conta que a API faz
// (backend/src/validacao.js). Pega erro de digitação e CPF inventado; não
// prova que o CPF é da pessoa. Todos os números iguais passam na conta, mas
// não existem.
export function cpfValido(texto) {
  const cpf = texto.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (quantos) => {
    let soma = 0;
    for (let i = 0; i < quantos; i++) {
      soma += Number(cpf[i]) * (quantos + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

// A mesma regra da API (backend/src/validacao.js): DDD sem zero, e depois um
// celular (9 + 8 dígitos) ou um fixo (8 dígitos, começando de 2 a 8).
export const telefoneValido = (texto) =>
  /^[1-9]{2}(?:9\d{8}|[2-8]\d{7})$/.test(texto.replace(/\D/g, ""));

// Telefone formatado enquanto a pessoa digita: só números, DDD e no máximo
// 11 dígitos. Fixo "(31) 3899-1234", celular "(31) 99999-1234"; o traço muda
// de lugar quando entra o 11º dígito.
export function formatarTelefone(texto) {
  const digitos = texto.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  if (!numero) return `(${ddd}`;
  const corte = numero.length === 9 ? 5 : 4;
  return numero.length > corte
    ? `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`
    : `(${ddd}) ${numero}`;
}

// ─── Pessoas ──────────────────────────────────────────────────────────────────
// Os dados de uma pessoa seguem a tabela usuario do banco: o papel (TUTOR ou
// VETERINARIO), o nome completo e, para o veterinário, o tratamento (DR ou
// DRA), que ele escolhe no cadastro. O banco não guarda gênero de tutores, e
// por isso o site os trata sem marcar gênero ("Tutor(a)").

// `pessoa` pode faltar (o visitante, sem conta).
export const ehVeterinario = (pessoa) => pessoa?.papel === "VETERINARIO";

const ehDra = (pessoa) => pessoa.tratamento === "DRA";

// "Victor Hugo Martins" -> "Victor Martins": o primeiro nome e o último
// sobrenome, como o topo e os cartões mostram. O banco guarda só o completo.
export function nomeCurto(pessoa) {
  const partes = pessoa.nomeCompleto.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes.at(-1)}` : partes[0];
}

// "Dr." ou "Dra.", como o veterinário assina validações e coletas.
export const tratamento = (pessoa) => (ehDra(pessoa) ? "Dra." : "Dr.");

// "Dr. Victor Martins", como o veterinário assina.
export const nomeProfissional = (pessoa) =>
  `${tratamento(pessoa)} ${nomeCurto(pessoa)}`;

// "Dr. Victor", nas frases sobre um pedido de liberação.
export const nomeProfissionalCurto = (pessoa) =>
  `${tratamento(pessoa)} ${primeiroNome(pessoa.nomeCompleto)}`;

// "Veterinário", "Veterinária" ou "Tutor(a)".
export function rotuloPapel(pessoa) {
  if (ehVeterinario(pessoa)) {
    return ehDra(pessoa) ? "Veterinária" : "Veterinário";
  }
  return "Tutor(a)";
}

// "ele" ou "ela", em frases sobre um veterinário ("assim que ela liberar").
export const pronome = (veterinario) => (ehDra(veterinario) ? "ela" : "ele");

// ─── Código público ───────────────────────────────────────────────────────────
// Cada pessoa e cada animal tem um código de 6 letras e números (#T3M8P1). É
// por ele que o veterinário libera um tutor e o tutor encontra um veterinário:
// nomes se repetem, códigos não.

export const TAMANHO_CODIGO = 6;

// O código costuma ser copiado do perfil com "#" na frente; a limpeza faz
// colar direto funcionar.
export const limparCodigo = (texto) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TAMANHO_CODIGO);
