import { useState } from "react";
import Modal from "./Modal";
import Botao from "./Botao";
import Selecao from "./Selecao";
import Calendario from "./Calendario";

// Histórico de coletas do animal e, para o veterinário, o registro de uma
// nova. A doação é um evento assinado, não um contador: cada linha guarda
// quando, onde, quanto e quem acompanhou — é dessa lista que saem o total do
// perfil e o intervalo de recuperação.

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const paraData = (dataBR) => {
  const [dia, mes, ano] = dataBR.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
};

const formatarBR = (data) =>
  `${String(data.getDate()).padStart(2, "0")}/${String(
    data.getMonth() + 1,
  ).padStart(2, "0")}/${data.getFullYear()}`;

// A data é a identidade de uma coleta, então ela vira o marcador da linha.
function ItemDoacao({ doacao }) {
  const data = paraData(doacao.data);

  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="w-12 shrink-0 text-center">
        <p className="text-xl font-extrabold text-[#8e001b] leading-none tabular-nums">
          {String(data.getDate()).padStart(2, "0")}
        </p>
        <p className="text-[11px] text-[#8f6f6e] mt-1 leading-none">
          {MESES_CURTOS[data.getMonth()]} {data.getFullYear()}
        </p>
      </div>
      <div className="min-w-0 flex-1 border-l border-[#f0e6e6] pl-4">
        <p className="font-semibold text-[#1a1c1c] text-sm">
          {doacao.hospital}
        </p>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-relaxed">
          {doacao.volumeMl} mL coletados por {doacao.veterinario}, CRMV{" "}
          {doacao.crmv}
        </p>
        {doacao.nota && (
          <p className="text-sm text-[#5b403f] mt-1.5 leading-relaxed">
            {doacao.nota}
          </p>
        )}
      </div>
    </li>
  );
}

function Formulario({ animal, hospitais, hospitalPadrao, onSalvar }) {
  const [data, setData] = useState(null);
  const [volume, setVolume] = useState("");
  const [hospital, setHospital] = useState(hospitalPadrao || "");
  const [nota, setNota] = useState("");

  const pronto = data && Number(volume) > 0 && hospital;

  const enviar = (e) => {
    e.preventDefault();
    if (!pronto) return;
    onSalvar({
      data: formatarBR(data),
      volumeMl: Number(volume),
      hospital: hospitais.find((h) => h.id === hospital).nome,
      nota: nota.trim(),
    });
  };

  return (
    <form id="form-doacao" onSubmit={enviar} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,17rem)_1fr] gap-5">
        <div>
          <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
            Dia da coleta
          </p>
          <Calendario valor={data} onEscolher={setData} />
          <p className="text-xs text-[#5f5e5e] mt-2">
            {data
              ? `Coleta em ${formatarBR(data)}.`
              : "Escolha o dia em que o sangue foi coletado."}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="volume-doacao"
              className="block text-sm font-semibold text-[#1a1c1c] mb-2"
            >
              Volume coletado
            </label>
            <div className="flex items-center h-12 bg-white border border-[#dccfcf] rounded-xl shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors focus-within:border-[#b7102a] focus-within:ring-4 focus-within:ring-[#b7102a]/10">
              <input
                id="volume-doacao"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder={animal.especie === "Gato" ? "50" : "450"}
                className="flex-1 min-w-0 h-full px-4 bg-transparent text-base text-[#1a1c1c] placeholder:text-[#a79d9d] focus:outline-none"
              />
              <span className="pr-4 text-sm font-semibold text-[#8f6f6e] select-none">
                mL
              </span>
            </div>
            <p className="text-xs text-[#5f5e5e] mt-2">
              O que saiu na bolsa.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
              Onde foi feita
            </p>
            <Selecao
              valor={hospital}
              onChange={setHospital}
              placeholder="Selecione o local"
              icone="local_hospital"
              opcoes={hospitais.map((h) => ({
                valor: h.id,
                rotulo: h.nome,
                descricao: h.cidade,
                icone: "local_hospital",
              }))}
            />
          </div>

          <div>
            <label
              htmlFor="nota-doacao"
              className="block text-sm font-semibold text-[#1a1c1c] mb-2"
            >
              Como foi a coleta (opcional)
            </label>
            <textarea
              id="nota-doacao"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={`Ex.: ${animal.nome} ficou tranquilo, sem necessidade de sedação.`}
              className="w-full px-4 py-3 bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] placeholder:text-[#a79d9d] resize-none transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10"
            />
            <p className="text-xs text-[#5f5e5e] mt-2">
              Fica no histórico desta coleta, com a sua assinatura.
            </p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={!pronto} className="hidden" />
    </form>
  );
}

function ModalDoacoes({
  animal,
  doacoes,
  podeRegistrar,
  hospitais,
  hospitalPadrao,
  assinatura,
  onRegistrar,
  onClose,
}) {
  const [registrando, setRegistrando] = useState(false);

  const total = doacoes.length;

  if (registrando) {
    return (
      <Modal
        titulo={`Registrar doação de ${animal.nome}`}
        subtitulo="A coleta entra no histórico assinada por você"
        largura="max-w-2xl"
        onClose={onClose}
        rodape={
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[11px] text-[#5f5e5e] leading-snug">
              Registrado por{" "}
              <strong className="text-[#1a1c1c]">{assinatura.nome}</strong>, CRMV{" "}
              {assinatura.crmv}
            </p>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                onClick={() => setRegistrando(false)}
              >
                Voltar
              </Botao>
              <Botao type="submit" form="form-doacao">
                Registrar doação
              </Botao>
            </div>
          </div>
        }
      >
        <Formulario
          animal={animal}
          hospitais={hospitais}
          hospitalPadrao={hospitalPadrao}
          onSalvar={(dados) => {
            onRegistrar(dados);
            setRegistrando(false);
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal
      titulo={`Doações de ${animal.nome}`}
      subtitulo={
        total === 0
          ? "Nenhuma coleta registrada"
          : `${total} ${total === 1 ? "coleta registrada" : "coletas registradas"}`
      }
      onClose={onClose}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={onClose}>
            Fechar
          </Botao>
          {podeRegistrar && (
            <Botao icone="add" onClick={() => setRegistrando(true)}>
              Registrar doação
            </Botao>
          )}
        </div>
      }
    >
      {total === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-[#c9a5a5] text-5xl">
            water_drop
          </span>
          <p className="font-bold text-[#1a1c1c] mt-3">
            {animal.nome} ainda não doou
          </p>
          <p className="text-sm text-[#5f5e5e] mt-1 leading-relaxed max-w-sm mx-auto">
            {podeRegistrar
              ? "Depois de uma coleta, registre aqui para que o intervalo de recuperação seja contado a partir dela."
              : "Quando a primeira coleta acontecer, o veterinário registra aqui e a data aparece no perfil."}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[#f0e6e6]">
            {doacoes.map((d) => (
              <ItemDoacao key={d.id} doacao={d} />
            ))}
          </ul>
          <p className="text-xs text-[#5f5e5e] leading-relaxed mt-5 pt-4 border-t border-[#f0e6e6]">
            Depois de cada coleta o animal espera cerca de três meses para se
            recuperar. A conta começa na data mais recente desta lista.
          </p>
        </>
      )}
    </Modal>
  );
}

export default ModalDoacoes;
