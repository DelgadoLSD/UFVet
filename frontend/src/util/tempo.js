// Formatações de tempo usadas pelo acesso aos contatos: liberações têm prazo,
// e os pedidos mostram há quanto tempo chegaram.
const HORA = 3600 * 1000;
const DIA = 24 * HORA;

export const daquiAHoras = (horas) => new Date(Date.now() + horas * HORA).toISOString();
export const horasAtras = (horas) => new Date(Date.now() - horas * HORA).toISOString();

export const horasRestantes = (iso) => (new Date(iso) - Date.now()) / HORA;

export const expirou = (iso) => horasRestantes(iso) <= 0;

// "expira em 2 dias" / "expira em 5 horas" / "expirou"
export function tempoRestante(iso) {
  const horas = horasRestantes(iso);
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
export function quando(iso) {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const inicio = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dias = Math.round((inicio(new Date()) - inicio(data)) / DIA);
  if (dias === 0) return `hoje às ${hora}`;
  if (dias === 1) return `ontem às ${hora}`;
  const dia = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia} às ${hora}`;
}
