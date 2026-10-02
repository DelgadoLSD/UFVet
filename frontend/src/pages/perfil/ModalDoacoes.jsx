import { useState } from "react";
import Modal from "../../components/Modal";
import Botao from "../../components/Botao";
import Selecao from "../../components/Selecao";
import AreaTexto from "../../components/AreaTexto";
import Calendario from "../../components/Calendario";
import MarcadorData from "./MarcadorData";
import { useSessao } from "../../servicos/sessao";
import { HOSPITAIS, acharHospital } from "../../servicos/pessoas";
import { formatarData, paraISO } from "../../util/datas";
import { idProvisorio } from "../../util/ids";
import { nomeProfissional } from "../../util/texto";

// Histórico de coletas do animal e, para o veterinário, o registro de uma
// nova. A doação é um evento assinado, não um contador: cada linha guarda
// quando, onde, quanto e quem acompanhou. É dessa lista que saem o total do
// perfil e o intervalo de recuperação.

function ItemDoacao({ doacao }) {
  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <MarcadorData data={doacao.dataColeta} />
      <div className="min-w-0 flex-1 border-l border-[#f0e6e6] pl-4">
        <p className="font-semibold text-[#1a1c1c] text-sm">
          {doacao.estabelecimento}
        </p>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-relaxed">
          {doacao.volumeMl} mL coletados por {doacao.veterinarioNome}, CRMV{" "}
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

// Formulário de uma coleta nova. O botão de enviar fica no rodapé do modal,
// ligado a este formulário pelo id "form-doacao".
function FormularioDoacao({ animal, hospitalPadrao, onSalvar }) {
  const [data, setData] = useState(null);
  const [volume, setVolume] = useState("");
  const [hospital, setHospital] = useState(hospitalPadrao || "");
  const [nota, setNota] = useState("");

  const pronto = data && Number(volume) > 0 && hospital;

  const enviar = (e) => {
    e.preventDefault();
    if (!pronto) return;
    onSalvar({
      dataColeta: paraISO(data),
      volumeMl: Number(volume),
      estabelecimento: acharHospital(hospital).nome,
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
              ? `Coleta em ${formatarData(data)}.`
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
                placeholder={animal.especie === "GATO" ? "50" : "450"}
                className="flex-1 min-w-0 h-full px-4 bg-transparent text-base text-[#1a1c1c] placeholder:text-[#a79d9d] focus:outline-none"
              />
              <span className="pr-4 text-sm font-semibold text-[#8f6f6e] select-none">
                mL
              </span>
            </div>
            <p className="text-xs text-[#5f5e5e] mt-2">O que saiu na bolsa.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
              Onde foi feita
            </p>
            <Selecao
              rotulo="Onde foi feita"
              valor={hospital}
              onEscolher={setHospital}
              placeholder="Selecione o local"
              icone="local_hospital"
              opcoes={HOSPITAIS.map((h) => ({
                valor: h.id,
                rotulo: h.nome,
                descricao: h.cidade,
                icone: "local_hospital",
              }))}
            />
          </div>

          <AreaTexto
            id="nota-doacao"
            rotulo="Como foi a coleta (opcional)"
            dica="Fica no histórico desta coleta, com a sua assinatura."
            placeholder={`Ex.: ${animal.nome} ficou tranquilo, sem necessidade de sedação.`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
      </div>

      {/* Envio pelo Enter, enquanto o foco está num campo do formulário. */}
      <button type="submit" disabled={!pronto} className="hidden" />
    </form>
  );
}

// `onRegistrar` recebe a doação nova já assinada por quem está logado.
function ModalDoacoes({
  animal,
  doacoes,
  podeRegistrar,
  onRegistrar,
  onFechar,
}) {
  const usuario = useSessao();
  const [registrando, setRegistrando] = useState(false);

  const total = doacoes.length;

  if (registrando) {
    return (
      <Modal
        titulo={`Registrar doação de ${animal.nome}`}
        subtitulo="A coleta entra no histórico assinada por você"
        largura="max-w-2xl"
        onFechar={onFechar}
        rodape={
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[11px] text-[#5f5e5e] leading-snug">
              Registrado por{" "}
              <strong className="text-[#1a1c1c]">
                {nomeProfissional(usuario)}
              </strong>
              , CRMV {usuario.crmv}
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
        <FormularioDoacao
          animal={animal}
          // O local já vem preenchido com o hospital de quem registra.
          hospitalPadrao={usuario.hospitalId}
          onSalvar={(dados) => {
            onRegistrar({
              ...dados,
              id: idProvisorio(),
              veterinarioNome: nomeProfissional(usuario),
              crmv: usuario.crmv,
            });
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
      onFechar={onFechar}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={onFechar}>
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
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#c9a5a5] text-5xl"
          >
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
