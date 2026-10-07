// Datas e prazos do site, num lugar só.
//
// Convenção: os dados guardam datas no formato ISO, o mesmo do banco e da
// API. Uma data sem hora (dia da coleta, nascimento) é "AAAA-MM-DD"; um
// instante (quando um pedido chegou, quando uma liberação expira) é o ISO
// completo, com hora e fuso. A formatação para a tela ("05/09/2026",
// "hoje às 14:20") acontece só na hora de exibir, com as funções daqui.

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const MESES_CURTOS = MESES.map((mes) => mes.slice(0, 3));

const doisDigitos = (n) => String(n).padStart(2, "0");

// Converte para Date uma data "AAAA-MM-DD" ou um instante ISO completo.
// A data sem hora é lida no fuso local de propósito: new Date("2026-03-10")
// seria meia-noite em UTC, que no Brasil ainda é o dia 9.
export function paraData(valor) {
  if (valor instanceof Date) return new Date(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return new Date(valor);
}

// Date -> "AAAA-MM-DD", no fuso local: o formato das colunas de data do banco.
export const paraISO = (data) =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

export const hojeISO = () => paraISO(new Date());

// "05/09/2026"
export function formatarData(valor) {
  const data = paraData(valor);
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`;
}

// "14:20"
export const formatarHora = (valor) =>
  paraData(valor).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// "fev/2025", usado em "Membro desde" e "No UFVet desde".
export function mesAno(valor) {
  const data = paraData(valor);
  return `${MESES_CURTOS[data.getMonth()]}/${data.getFullYear()}`;
}

export function somarDias(valor, dias) {
  const data = paraData(valor);
  data.setDate(data.getDate() + dias);
  return paraISO(data);
}

export function somarAnos(valor, anos) {
  const data = paraData(valor);
  data.setFullYear(data.getFullYear() + anos);
  return paraISO(data);
}

// A idade nunca é guardada como número: sai da data de nascimento a cada
// exibição, e por isso não fica desatualizada.
export function idadeEmAnos(nascimento) {
  const data = paraData(nascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - data.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < data.getMonth() ||
    (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return anos;
}

// "3 anos", "Menos de 1 ano". Quando a data de nascimento é uma estimativa
// do tutor, "Cerca de 3 anos": a tela não sugere precisão que o dado não tem
// (NF12.1).
export function textoIdade(anos, aproximada = false) {
  if (anos <= 0) return "Menos de 1 ano";
  const texto = `${anos} ano${anos > 1 ? "s" : ""}`;
  return aproximada ? `Cerca de ${texto}` : texto;
}

// ─── Prazos em horas (acesso aos contatos) ────────────────────────────────────

export const daquiAHoras = (horas) =>
  new Date(Date.now() + horas * HORA).toISOString();

export const horasAtras = (horas) =>
  new Date(Date.now() - horas * HORA).toISOString();

export const horasRestantes = (valor) => (paraData(valor) - Date.now()) / HORA;

export const expirou = (valor) => horasRestantes(valor) <= 0;

// "expira em 2 dias" / "expira em 5 horas" / "expirou"
export function tempoRestante(valor) {
  const horas = horasRestantes(valor);
  if (horas <= 0) return "expirou";
  if (horas < 1) return "expira em menos de 1 hora";
  if (horas < 24) {
    const h = Math.round(horas);
    return `expira em ${h} ${h === 1 ? "hora" : "horas"}`;
  }
  const dias = Math.floor(horas / 24);
  return `expira em ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

// "hoje às 14:20" / "ontem às 09:05" / "12/09 às 16:40"
export function quando(valor) {
  const data = paraData(valor);
  const hora = formatarHora(data);
  const inicioDoDia = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dias = Math.round((inicioDoDia(new Date()) - inicioDoDia(data)) / DIA);
  if (dias === 0) return `hoje às ${hora}`;
  if (dias === 1) return `ontem às ${hora}`;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} às ${hora}`;
}
