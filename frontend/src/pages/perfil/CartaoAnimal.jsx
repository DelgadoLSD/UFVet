import { useState } from "react";
import Botao from "../../components/Botao";
import CodigoCopiavel from "../../components/CodigoCopiavel";
import AjudaDisponibilidade from "./AjudaDisponibilidade";
import CarrosselFotos from "./CarrosselFotos";
import DadosDoAnimal from "./DadosDoAnimal";
import PainelValidacao from "./PainelValidacao";
import SecaoObservacoes from "./SecaoObservacoes";
import SecaoDocumentos from "./SecaoDocumentos";
import ModalAnimal from "./ModalAnimal";
import ModalValidacao from "./ModalValidacao";
import ModalHistoricoValidacao from "./ModalHistoricoValidacao";
import ModalDoacoes from "./ModalDoacoes";
import ModalExcluirAnimal from "./ModalExcluirAnimal";
import { confirmar } from "../../hooks/confirmacoes";
import { salvarAnimal } from "../../servicos/animais";
import { useSessao } from "../../servicos/sessao";
import {
  ESPECIES,
  REFERENCIA_DOADOR,
  SEXOS,
  dataUltimaDoacao,
  finalDoGenero,
  nomeRaca,
  situacaoRecuperacao,
  textoCastracao,
} from "../../regras/doacao";
import { formatarData } from "../../util/datas";
import { nomeProfissional } from "../../util/texto";

// Cartão de um animal no perfil: cabeçalho com nome e disponibilidade, fotos,
// dados de doador, validação veterinária, observações e documentos.
//
// Os dados do animal e a disponibilidade gravam na API, e o perfil recebe o
// animal novo por `onAlterado` (ou o aviso de que ele saiu, por
// `onExcluido`). O resto (validação, doação, observação, documento) ainda é
// guardado só no cartão e vale até recarregar a página; cada parte passa a
// chamar a API na etapa dela.
//
// - `ehDono`: o perfil é de quem está logado; pode editar, excluir, mudar a
//   disponibilidade e enviar documentos.
// - `ehVet`: quem está logado é veterinário; pode validar, registrar doações
//   e escrever observações, inclusive nos próprios animais.

// Etiqueta de disponibilidade. Fala só de disponibilidade; o que a validação
// muda na prática está no painel de validação, logo abaixo.
function estiloDisponibilidade(disponivel, recuperacao) {
  if (!disponivel) {
    return {
      texto: "Indisponível no momento",
      classe: "bg-[#eeeeee] text-[#5f5e5e]",
      ponto: "bg-gray-400",
    };
  }
  if (!recuperacao.apto) {
    return {
      texto: `Em recuperação até ${formatarData(recuperacao.liberadaEm)}`,
      classe: "bg-sky-50 text-sky-800",
      ponto: "bg-sky-500",
    };
  }
  return {
    texto: "Disponível para doação",
    classe: "bg-emerald-50 text-emerald-700",
    ponto: "bg-emerald-500 animate-pulse",
  };
}

function CartaoAnimal({
  animal,
  ehDono,
  ehVet,
  nomeTutor,
  onAlterado,
  onExcluido,
}) {
  const usuario = useSessao();
  const disponivel = animal.disponivel;
  const [mudandoDisponibilidade, setMudandoDisponibilidade] = useState(false);
  const [erroDisponibilidade, setErroDisponibilidade] = useState("");
  // O histórico é a fonte de verdade; "validacao" é sempre a mais recente
  // dele. Uma validação assinada nunca é editada: revisar cria uma entrada
  // nova, no começo da lista, e a anterior continua no histórico,
  // substituída.
  const [validacoes, setValidacoes] = useState(animal.validacoes);
  const validacao = validacoes[0] ?? null;
  // Quem confirma o tipo sanguíneo é o veterinário, ao assinar a tipagem; o
  // valor do exame é o que vale daí em diante.
  const [tipoSanguineo, setTipoSanguineo] = useState(animal.tipoSanguineo);
  const [doacoes, setDoacoes] = useState(animal.doacoes);
  const [observacoes, setObservacoes] = useState(animal.observacoes);
  const [documentos, setDocumentos] = useState(animal.documentos);
  // Modal aberto no momento: "editar", "excluir", "validar", "historico",
  // "doacoes" ou null.
  const [modal, setModal] = useState(null);
  const fecharModal = () => setModal(null);

  // Quem é veterinário continua veterinário nos próprios animais: pode ser
  // ele mesmo quem valida e quem acompanha a coleta.
  const podeAtuarComoVet = ehVet;

  // O animal como está agora, com o que já mudou neste cartão.
  const animalAtual = { ...animal, tipoSanguineo, validacao, doacoes };
  // A recuperação conta a partir da coleta mais recente registrada: registrar
  // uma doação nova já muda a etiqueta do animal.
  const ultimaDoacao = dataUltimaDoacao(doacoes);
  const recuperacao = situacaoRecuperacao(
    ultimaDoacao,
    REFERENCIA_DOADOR[animal.especie],
  );
  const etiqueta = estiloDisponibilidade(disponivel, recuperacao);

  // Tirar da busca ou devolver (F11).
  const mudarDisponibilidade = async (nova) => {
    setMudandoDisponibilidade(true);
    setErroDisponibilidade("");
    try {
      onAlterado(await salvarAnimal(animal.codigo, { disponivel: nova }));
      confirmar(
        nova
          ? `${animal.nome} voltou para a busca`
          : `${animal.nome} saiu da busca`,
      );
    } catch (falha) {
      setErroDisponibilidade(falha.message);
    } finally {
      setMudandoDisponibilidade(false);
    }
  };

  const adicionarObservacao = (texto) =>
    setObservacoes((prev) => [
      {
        criadoEm: new Date().toISOString(),
        autorNome: nomeProfissional(usuario),
        texto,
      },
      ...prev,
    ]);

  // Sem API, o arquivo escolhido vira uma URL temporária do navegador.
  const enviarDocumento = (tipo, arquivo) => {
    if (!arquivo) return;
    const versao = {
      arquivoUrl: URL.createObjectURL(arquivo),
      enviadoEm: new Date().toISOString(),
      enviadoPorNome: nomeTutor,
    };
    setDocumentos((prev) =>
      prev.map((d) =>
        d.tipo === tipo ? { ...d, versoes: [...d.versoes, versao] } : d,
      ),
    );
  };

  const conteudoEtiqueta = (
    <>
      <span className={`w-2 h-2 rounded-full ${etiqueta.ponto}`} />
      {etiqueta.texto}
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      {/* ── Cabeçalho ── */}
      <div className="px-8 py-5 flex justify-between items-center gap-4 flex-wrap border-b border-[#eadede]">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-2xl text-[#8e001b] leading-none">
              {animal.nome}
            </h3>
            <span className="text-xs font-semibold text-[#5b403f] bg-[#f3eeee] px-2.5 py-1 rounded-md">
              {ESPECIES[animal.especie].rotulo}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Para o dono, a etiqueta é um botão que alterna a
                  disponibilidade; para os outros, só informa. */}
              {ehDono ? (
                <button
                  type="button"
                  onClick={() => mudarDisponibilidade(!disponivel)}
                  disabled={mudandoDisponibilidade}
                  aria-label={`${etiqueta.texto}. Clique para marcar como ${disponivel ? "indisponível" : "disponível"}.`}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all hover:brightness-95 active:scale-95 ${etiqueta.classe}`}
                >
                  {conteudoEtiqueta}
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[14px] opacity-60"
                  >
                    swap_horiz
                  </span>
                </button>
              ) : (
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${etiqueta.classe}`}
                >
                  {conteudoEtiqueta}
                </span>
              )}
              <AjudaDisponibilidade
                animal={animal}
                ehDono={ehDono}
                disponivel={disponivel}
                recuperacao={recuperacao}
              />
            </div>
          </div>
          {erroDisponibilidade && (
            <p role="alert" className="text-xs text-red-600">
              {erroDisponibilidade}
            </p>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm text-[#5f5e5e]">
              {nomeRaca(animal)}, {SEXOS[animal.sexo].toLowerCase()},{" "}
              {textoCastracao(animal).toLowerCase()}
            </p>
            <CodigoCopiavel codigo={animal.codigo} />
          </div>
        </div>

        {ehDono && (
          <div className="flex items-center gap-2">
            <Botao
              variante="editar"
              tamanho="md"
              icone="edit"
              aria-label={`Editar ${animal.nome}`}
              title="Editar"
              onClick={() => setModal("editar")}
            />
            <Botao
              variante="perigo"
              tamanho="md"
              icone="delete"
              aria-label={`Excluir ${animal.nome}`}
              title="Excluir"
              onClick={() => setModal("excluir")}
            />
          </div>
        )}
      </div>

      {/* ── Corpo ── */}
      <div className="p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0">
            <CarrosselFotos
              fotos={animal.fotos.map((foto) => foto.url)}
              nome={animal.nome}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <DadosDoAnimal
              animal={animal}
              tipoSanguineo={tipoSanguineo}
              totalDoacoes={doacoes.length}
              ultimaDoacao={ultimaDoacao}
              onVerDoacoes={() => setModal("doacoes")}
            />

            <PainelValidacao
              nomeAnimal={animal.nome}
              validacao={validacao}
              totalValidacoes={validacoes.length}
              podeValidar={podeAtuarComoVet}
              ehDono={ehDono}
              onValidar={() => setModal("validar")}
              onVerHistorico={() => setModal("historico")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecaoObservacoes
            animal={animal}
            observacoes={observacoes}
            podeAdicionar={podeAtuarComoVet}
            onAdicionar={adicionarObservacao}
          />
          <SecaoDocumentos
            documentos={documentos}
            podeEnviar={ehDono}
            onEnviar={enviarDocumento}
          />
        </div>
      </div>

      {modal === "validar" && (
        <ModalValidacao
          animal={animalAtual}
          validacao={validacao}
          onSalvar={(nova) => {
            setValidacoes((prev) => [nova, ...prev]);
            if (nova.tipoSanguineoConfirmado) {
              setTipoSanguineo(nova.tipoSanguineoConfirmado);
            }
            fecharModal();
          }}
          onFechar={fecharModal}
        />
      )}

      {modal === "historico" && (
        <ModalHistoricoValidacao
          animal={animal}
          validacoes={validacoes}
          onFechar={fecharModal}
        />
      )}

      {modal === "doacoes" && (
        <ModalDoacoes
          animal={animal}
          doacoes={doacoes}
          podeRegistrar={podeAtuarComoVet}
          // A lista fica da coleta mais recente para a mais antiga, mesmo
          // quando a registrada agora é de uma data passada.
          onRegistrar={(nova) =>
            setDoacoes((prev) =>
              [nova, ...prev].sort((a, b) =>
                b.dataColeta.localeCompare(a.dataColeta),
              ),
            )
          }
          onFechar={fecharModal}
        />
      )}

      {modal === "editar" && (
        <ModalAnimal
          animal={animalAtual}
          onFechar={fecharModal}
          onSalvo={(salvo) => {
            onAlterado(salvo);
            confirmar("Alterações salvas");
            fecharModal();
          }}
        />
      )}

      {modal === "excluir" && (
        <ModalExcluirAnimal
          animal={animalAtual}
          disponivel={disponivel}
          onMarcarIndisponivel={async () => {
            fecharModal();
            await mudarDisponibilidade(false);
          }}
          onExcluido={() => {
            onExcluido(animal.codigo);
            confirmar(`${animal.nome} excluíd${finalDoGenero(animal)}`);
          }}
          onFechar={fecharModal}
        />
      )}
    </div>
  );
}

export default CartaoAnimal;
