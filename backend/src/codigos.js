import { randomInt } from "node:crypto";

// Códigos que as pessoas leem, digitam ou ditam: o código público de cada
// conta (#T3M8P1) e o código de convite de veterinário (7K3P-9XQ2).
//
// O alfabeto deixa de fora 0, O, 1, I e L, que se confundem ao ler ou ditar.
// O sorteio usa o gerador criptográfico do Node, que não é previsível.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const sortear = (quantos) =>
  Array.from(
    { length: quantos },
    () => ALFABETO[randomInt(ALFABETO.length)],
  ).join("");

// Código público de uma conta (F6): seis caracteres, e o primeiro diz o
// papel (T para tutor, V para veterinário). A unicidade é conferida por quem
// grava (NF6.1).
export const sortearCodigoPublico = (papel) =>
  (papel === "VETERINARIO" ? "V" : "T") + sortear(5);

// Código público de um animal (F6): seis caracteres, sem prefixo.
export const sortearCodigoAnimal = () => sortear(6);

// Sorteia até achar um código que ninguém usa (NF6.1). São centenas de
// milhões de combinações: repetir é raríssimo, e as tentativas extras são só
// por garantia. `emUso(codigo)` diz se o código já está gravado.
export async function sortearCodigoLivre(sortearCodigo, emUso) {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = sortearCodigo();
    if (!(await emUso(codigo))) return codigo;
  }
  throw new Error("Não foi possível sortear um código público livre.");
}

// Código de convite: oito caracteres, em dois blocos para facilitar a cópia.
// Com 31 opções por caractere, são cerca de 850 bilhões de combinações.
export const sortearCodigoConvite = () => `${sortear(4)}-${sortear(4)}`;

// O código que chega no endereço (/animais/z7r2k4, /usuarios/t3m8p1), sem
// espaços e em maiúsculas, como é gravado.
export const codigoDoEndereco = (valor) => valor.trim().toUpperCase();
