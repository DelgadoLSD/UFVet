import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Modal from "../../components/Modal";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import Selecao from "../../components/Selecao";
import AreaTexto from "../../components/AreaTexto";
import Calendario from "../../components/Calendario";
import { errosDaDoacao } from "./formularioDoacao";
import { REFERENCIA_DOADOR } from "../../regras/doacao";
import { useSessao } from "../../servicos/sessao";
import { listarEstabelecimentos } from "../../servicos/animais";
import { dataPorExtenso, formatarData, paraISO } from "../../util/datas";
import { nomeProfissional } from "../../util/texto";

// Histórico de coletas do animal e, para o veterinário, o registro de uma
// nova. A doação é um evento assinado, não um contador: cada linha guarda
// quando, onde, quanto e quem acompanhou. É dessa lista que saem o total do
// perfil e o intervalo de recuperação.

// Uma linha com ícone e texto, para "onde" e "quem" de cada coleta.
function Detalhe({ icone, children }) {
  return (
    <p className="flex items-start gap-2 text-sm text-[#5b403f] leading-snug">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] text-[#8f6f6e] shrink-0"
      >
        {icone}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

// Uma coleta: o dia e o volume em cima, depois onde foi e quem coletou, cada
// um na sua linha, e a nota, se houver, numa caixa à parte. A lista já é
// separada por ano, então o dia vem sem o ano.
function ItemDoacao({ doacao }) {
  return (
    <li className="py-5 first:pt-4 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-base font-bold text-[#1a1c1c]">
          {dataPorExtenso(doacao.dataColeta, { ano: false })}
        </p>
        <p className="shrink-0 text-lg font-extrabold text-[#9e0a24] tabular-nums">
          {doacao.volumeMl}
          <span className="text-sm font-bold"> mL</span>
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <Detalhe icone="local_hospital">{doacao.estabelecimento}</Detalhe>
        <Detalhe icone="stethoscope">
          Coletado por {doacao.veterinarioNome}, CRMV {doacao.crmv}
        </Detalhe>
      </div>
      {doacao.nota && (
        <p className="mt-3 rounded-lg bg-[#faf6f6] px-3.5 py-2.5 text-sm text-[#5b403f] leading-relaxed">
          {doacao.nota}
        </p>
      )}
    </li>
  );
}

// As coletas separadas por ano, na ordem em que chegam (da mais recente
// para a mais antiga).
function porAno(doacoes) {
  const grupos = [];
  for (const doacao of doacoes) {
    const ano = doacao.dataColeta.slice(0, 4);
    if (grupos.at(-1)?.ano !== ano) grupos.push({ ano, doacoes: [] });
    grupos.at(-1).doacoes.push(doacao);
  }
  return grupos;
}

// O que importa saber antes da lista: quando foi a última coleta e se o
// animal ainda está se recuperando dela.
function Resumo({ animal, ultimaDoacao, recuperacao }) {
  const { intervaloDias } = REFERENCIA_DOADOR[animal.especie];
  return (
    <div className="rounded-xl bg-[#faf6f6] px-4 py-3.5 text-sm text-[#5b403f] leading-relaxed">
      A última coleta foi em{" "}
      <strong className="text-[#1a1c1c]">{dataPorExtenso(ultimaDoacao)}</strong>
      .{" "}
      {recuperacao.apto ? (
        <>O descanso de {intervaloDias} dias depois dela já terminou.</>
      ) : (
        <>
          {animal.nome} fica em recuperação até{" "}
          <strong className="text-[#1a1c1c]">
            {dataPorExtenso(recuperacao.liberadaEm)}
          </strong>
          : depois de cada coleta, são {intervaloDias} dias de descanso.
        </>
      )}
    </div>
  );
}

// O problema de um campo, embaixo dele. O `data-erro` marca o aviso para o
// formulário levar o primeiro deles para a vista.
function Erro({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} data-erro className="text-xs text-[#9e0a24] mt-2">
      {children}
    </p>
  );
}

// Formulário de uma coleta nova. O botão de enviar fica no rodapé do modal,
// ligado a este formulário pelo id "form-doacao". Os locais são os
// estabelecimentos cadastrados na API; o do veterinário já vem escolhido.
// Antes de enviar, o formulário confere o que falta e mostra embaixo de cada
// campo; `onSalvar` grava e devolve os erros de campo que a API apontar.
function FormularioDoacao({ animal, hospitalPadrao, onSalvar }) {
  const [data, setData] = useState(null);
  const [volume, setVolume] = useState("");
  const [hospital, setHospital] = useState(hospitalPadrao || "");
  const [nota, setNota] = useState("");
  const [locais, setLocais] = useState([]);
  const [erroLocais, setErroLocais] = useState("");
  const [erros, setErros] = useState({});
  const formRef = useRef(null);

  useEffect(() => {
    let valendo = true;
    listarEstabelecimentos().then(
      (lista) => valendo && setLocais(lista),
      (falha) => valendo && setErroLocais(falha.message),
    );
    return () => {
      valendo = false;
    };
  }, []);

  // Mudar um campo apaga o aviso dele.
  const mudar = (campo, definir) => (valor) => {
    definir(valor);
    setErros((prev) => {
      const sem = { ...prev };
      delete sem[campo];
      return sem;
    });
  };

  // Mostra os avisos e leva o primeiro para a vista: o corpo da janela rola,
  // e um aviso escondido faria o clique parecer sem efeito.
  const mostrarErros = (novos) => {
    flushSync(() => setErros(novos));
    formRef.current
      ?.querySelector("[data-erro]")
      ?.scrollIntoView({ block: "nearest" });
  };

  const enviar = async (e) => {
    e.preventDefault();
    const problemas = errosDaDoacao({
      data,
      volume,
      estabelecimentoId: hospital,
      locais,
    });
    if (Object.keys(problemas).length > 0) {
      mostrarErros(problemas);
      return;
    }
    const daApi = await onSalvar({
      dataColeta: paraISO(data),
      volumeMl: Number(volume),
      estabelecimentoId: hospital,
      nota: nota.trim(),
    });
    if (daApi) mostrarErros(daApi);
  };

  // Atributos do campo de volume quando há aviso.
  const volumeComErro = erros.volumeMl
    ? { "aria-invalid": true, "aria-describedby": "erro-volumeMl" }
    : {};

  return (
    <form
      ref={formRef}
      id="form-doacao"
      onSubmit={enviar}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,17rem)_1fr] gap-5">
        <div>
          <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
            Dia da coleta
          </p>
          <Calendario valor={data} onEscolher={mudar("dataColeta", setData)} />
          {erros.dataColeta ? (
            <Erro id="erro-dataColeta">{erros.dataColeta}</Erro>
          ) : (
            <p className="text-xs text-[#5f5e5e] mt-2">
              {data
                ? `Coleta em ${formatarData(data)}.`
                : "Escolha o dia em que o sangue foi coletado (hoje ou antes)."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="volume-doacao"
              className="block text-sm font-semibold text-[#1a1c1c] mb-2"
            >
              Volume coletado
            </label>
            <div className="flex items-center h-12 bg-white border border-[#dccfcf] rounded-xl shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors focus-within:border-[#9e0a24] focus-within:ring-4 focus-within:ring-[#9e0a24]/10">
              <input
                id="volume-doacao"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={volume}
                onChange={(e) => mudar("volumeMl", setVolume)(e.target.value)}
                {...volumeComErro}
                placeholder={animal.especie === "GATO" ? "50" : "450"}
                className="flex-1 min-w-0 h-full px-4 bg-transparent text-base text-[#1a1c1c] placeholder:text-[#a79d9d] focus:outline-none"
              />
              <span className="pr-4 text-sm font-semibold text-[#8f6f6e] select-none">
                mL
              </span>
            </div>
            {erros.volumeMl ? (
              <Erro id="erro-volumeMl">{erros.volumeMl}</Erro>
            ) : (
              <p className="text-xs text-[#5f5e5e] mt-2">
                O que saiu na bolsa.
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
              Onde foi feita
            </p>
            <Selecao
              rotulo="Onde foi feita"
              valor={hospital}
              onEscolher={mudar("estabelecimentoId", setHospital)}
              placeholder="Selecione o local"
              icone="local_hospital"
              opcoes={locais.map((l) => ({
                valor: l.id,
                rotulo: l.nome,
                descricao: `${l.cidade} - ${l.uf}`,
                icone: "local_hospital",
              }))}
            />
            {erroLocais && (
              <p className="text-xs font-semibold text-[#9e0a24] mt-2">
                {erroLocais}
              </p>
            )}
            <Erro id="erro-estabelecimentoId">{erros.estabelecimentoId}</Erro>
          </div>

          <div>
            <AreaTexto
              id="nota-doacao"
              rotulo="Como foi a coleta (opcional)"
              dica="Fica no histórico desta coleta, com a sua assinatura."
              placeholder={`Ex.: ${animal.nome} ficou tranquilo, sem necessidade de sedação.`}
              value={nota}
              onChange={(e) => mudar("nota", setNota)(e.target.value)}
            />
            <Erro id="erro-nota">{erros.nota}</Erro>
          </div>
        </div>
      </div>

      {/* Envio pelo Enter, enquanto o foco está num campo do formulário. */}
      <button type="submit" className="hidden" />
    </form>
  );
}

// `onRegistrar` recebe a doação nova e grava; quem assina é a conta de quem
// está logado, na API. Se a gravação falhar, o formulário continua aberto: o
// problema de um campo aparece embaixo dele, e o resto (sem conexão, limite
// de registros) acima dos botões, onde está sempre à vista. Com
// `iniciarRegistrando` (o botão "Registrar doação" do cartão), a janela já
// abre no formulário; "Voltar" leva ao histórico.
function ModalDoacoes({
  animal,
  doacoes,
  ultimaDoacao,
  recuperacao,
  podeRegistrar,
  iniciarRegistrando = false,
  onRegistrar,
  onFechar,
}) {
  const usuario = useSessao();
  const [registrando, setRegistrando] = useState(iniciarRegistrando);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState("");

  // Devolve ao formulário os erros de campo que a API apontar.
  const registrar = async (dados) => {
    setSalvando(true);
    setErroGeral("");
    try {
      await onRegistrar(dados);
      setRegistrando(false);
    } catch (falha) {
      if (falha.campos) return falha.campos;
      setErroGeral(falha.message);
    } finally {
      setSalvando(false);
    }
  };

  const total = doacoes.length;

  if (registrando) {
    return (
      <Modal
        titulo={`Registrar doação de ${animal.nome}`}
        subtitulo="A coleta entra no histórico assinada por você"
        largura="max-w-2xl"
        onFechar={onFechar}
        rodape={
          <div className="flex flex-col gap-3">
            <AvisoErro>{erroGeral}</AvisoErro>
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
                  onClick={() => {
                    setRegistrando(false);
                    setErroGeral("");
                  }}
                >
                  Voltar
                </Botao>
                <Botao type="submit" form="form-doacao" disabled={salvando}>
                  {salvando ? "Salvando…" : "Registrar doação"}
                </Botao>
              </div>
            </div>
          </div>
        }
      >
        <FormularioDoacao
          animal={animal}
          // O local já vem preenchido com o hospital de quem registra.
          hospitalPadrao={usuario.hospitalId}
          onSalvar={registrar}
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
      largura="max-w-2xl"
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
              ? "Depois de uma coleta, registre aqui: o descanso de recuperação passa a contar dela."
              : "Quando a primeira coleta acontecer, o veterinário registra aqui."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          <Resumo
            animal={animal}
            ultimaDoacao={ultimaDoacao}
            recuperacao={recuperacao}
          />
          {porAno(doacoes).map(({ ano, doacoes: doAno }) => (
            <section key={ano} aria-labelledby={`doacoes-${ano}`}>
              <h3
                id={`doacoes-${ano}`}
                className="text-sm font-extrabold text-[#9e0a24] pb-2 border-b border-[#eadede]"
              >
                {ano}
              </h3>
              <ul className="divide-y divide-[#f0e6e6]">
                {doAno.map((d, i) => (
                  <ItemDoacao key={`${d.dataColeta}-${i}`} doacao={d} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default ModalDoacoes;
