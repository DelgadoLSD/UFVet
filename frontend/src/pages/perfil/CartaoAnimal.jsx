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
import {
  apagarVersaoDoExame,
  enviarDocumento,
  registrarDoacao,
  registrarObservacao,
  salvarAnimal,
  validarAnimal,
} from "../../servicos/animais";
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

// Cartão de um animal no perfil. O cabeçalho é vermelho, com as letras em
// branco: nome, espécie, raça, código e a situação para doar, que o dono liga
// e desliga ali mesmo. Embaixo, a foto à esquerda (a da pessoa fica à
// direita, no cartão dela), a faixa de dados, a validação veterinária e, por
// fim, as observações para a coleta e os exames, cada parte num painel com
// faixa colorida no topo.
//
// Os dados do animal, a disponibilidade, o histórico clínico (validação,
// doação, observação) e os exames gravam na API, e o perfil recebe o animal
// novo por `onAlterado` (ou o aviso de que ele saiu, por `onExcluido`).
//
// - `ehDono`: o perfil é de quem está logado; pode editar, excluir, mudar a
//   disponibilidade e enviar documentos.
// - `ehVet`: quem está logado é veterinário; pode validar, registrar doações
//   e escrever observações, inclusive nos próprios animais.

// Situação para doar, mostrada no cabeçalho. Fala só de disponibilidade; o
// que a validação muda na prática está no painel de validação, logo abaixo.
// O `tom` escolhe a cor do ponto: verde pode doar, preto está se recuperando
// de uma doação e cinza foi pausado pelo tutor.
function situacaoParaDoar(disponivel, recuperacao) {
  if (!disponivel) {
    return { texto: "Indisponível no momento", tom: "pausado" };
  }
  if (!recuperacao.apto) {
    return {
      texto: `Em recuperação até ${formatarData(recuperacao.liberadaEm)}`,
      tom: "recuperacao",
    };
  }
  return { texto: "Disponível para doação", tom: "disponivel" };
}

function CartaoAnimal({ animal, ehDono, ehVet, onAlterado, onExcluido }) {
  const disponivel = animal.disponivel;
  const [mudandoDisponibilidade, setMudandoDisponibilidade] = useState(false);
  const [erroDisponibilidade, setErroDisponibilidade] = useState("");
  // O histórico vem do animal, como a API manda, do mais recente para o mais
  // antigo; "validacao" é a mais recente. Uma validação assinada nunca é
  // editada: revisar cria uma nova, no começo da lista, e a anterior continua
  // no histórico, substituída. O tipo sanguíneo é o que o veterinário
  // confirmou ao assinar a tipagem.
  const { validacoes, doacoes, observacoes, tipoSanguineo } = animal;
  const validacao = validacoes[0] ?? null;
  // Modal aberto no momento: "editar", "excluir", "validar", "historico",
  // "doacoes" (o histórico), "registrarDoacao" (a mesma janela, já no
  // formulário) ou null.
  const [modal, setModal] = useState(null);
  const fecharModal = () => setModal(null);

  // Quem é veterinário continua veterinário nos próprios animais: pode ser
  // ele mesmo quem valida e quem acompanha a coleta.
  const podeAtuarComoVet = ehVet;

  // O animal com a validação que vale agora, para os modais.
  const animalAtual = { ...animal, validacao };
  // A recuperação conta a partir da coleta mais recente registrada: registrar
  // uma doação nova já muda a etiqueta do animal.
  const ultimaDoacao = dataUltimaDoacao(doacoes);
  const recuperacao = situacaoRecuperacao(
    ultimaDoacao,
    REFERENCIA_DOADOR[animal.especie],
  );
  const situacao = situacaoParaDoar(disponivel, recuperacao);
  // Para quem visita, a etiqueta da situação é cheia, para ser lida de
  // relance: verde quando o animal pode doar agora; preta quando não pode
  // (pausado pelo tutor ou se recuperando de uma doação).
  const podeDoarAgora = situacao.tom === "disponivel";

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

  // O que o veterinário registra vai para a API, assinado pela conta dele. A
  // resposta traz o animal com o histórico novo, e o perfil troca o cartão.
  // Se der errado, o erro sobe para o modal ou a seção que pediu, que o
  // mostra sem fechar.
  const validar = async (dados) => {
    onAlterado(await validarAnimal(animal.codigo, dados));
    confirmar("Validação registrada");
  };
  const registrarNovaDoacao = async (dados) => {
    onAlterado(await registrarDoacao(animal.codigo, dados));
    confirmar("Doação registrada");
  };
  const adicionarObservacao = async (texto) => {
    onAlterado(await registrarObservacao(animal.codigo, texto));
    confirmar("Observação registrada");
  };

  // Os exames também vão para a API (F14): a resposta traz o animal com a
  // versão nova, ou sem a versão apagada (e, se a validação tinha conferido
  // aquele arquivo, com o critério sem efeito, F21). O erro sobe para quem
  // pediu: a linha do exame, ou a janela dele.
  const enviarNovoDocumento = async (tipo, arquivo) => {
    onAlterado(await enviarDocumento(animal.codigo, tipo, arquivo));
  };
  const apagarVersao = async (versao) => {
    const { animal: atualizado } = await apagarVersaoDoExame(versao);
    onAlterado(atualizado);
    return atualizado;
  };

  // A disponibilidade, logo abaixo da foto do animal e na largura dela: é
  // sobre aquele animal, então fica junto dele. Para o dono, uma chave de
  // duas opções numa pílula branca: um fundo vermelho desliza para a opção
  // escolhida (letra branca), e a outra fica branca com a letra vermelha.
  // Para quem visita, uma etiqueta com a situação.
  const disponibilidade = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-xs font-semibold text-[#5f5e5e]">
          Disponibilidade para doação
        </p>
        <AjudaDisponibilidade
          animal={animal}
          ehDono={ehDono}
          disponivel={disponivel}
          recuperacao={recuperacao}
        />
      </div>

      {ehDono ? (
        <div
          role="group"
          aria-label={`Disponibilidade de ${animal.nome} para doação`}
          className="relative grid grid-cols-2 p-1 rounded-full bg-white border border-[#eadede]"
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#9e0a24] transition-transform duration-200 ease-out motion-reduce:transition-none ${
              disponivel ? "translate-x-0" : "translate-x-full"
            }`}
          />
          {[
            { valor: true, rotulo: "Disponível" },
            { valor: false, rotulo: "Indisponível" },
          ].map((opcao) => {
            const escolhida = disponivel === opcao.valor;
            return (
              <button
                key={opcao.rotulo}
                type="button"
                aria-pressed={escolhida}
                onClick={() => !escolhida && mudarDisponibilidade(opcao.valor)}
                disabled={mudandoDisponibilidade}
                className={`relative h-9 rounded-full text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] focus-visible:ring-offset-1 disabled:cursor-wait ${
                  escolhida ? "text-white" : "text-[#9e0a24] hover:bg-[#fdecee]"
                }`}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>
      ) : (
        <p
          className={`flex items-center justify-center gap-2 h-11 px-4 rounded-full text-xs font-bold text-white whitespace-nowrap ${
            podeDoarAgora ? "bg-emerald-700" : "bg-[#1a1c1c]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`w-2 h-2 shrink-0 rounded-full ${
              podeDoarAgora
                ? "bg-white animate-pulse motion-reduce:animate-none"
                : "bg-white/50"
            }`}
          />
          {situacao.texto}
        </p>
      )}

      {/* Para o dono, a chave diz só disponível ou não; a data da volta
          depois de uma doação fica logo embaixo. */}
      {ehDono && disponivel && !recuperacao.apto && (
        <p className="text-xs text-[#5f5e5e] text-center">{situacao.texto}</p>
      )}
      {erroDisponibilidade && (
        <p role="alert" className="text-xs font-semibold text-[#9e0a24]">
          {erroDisponibilidade}
        </p>
      )}
    </div>
  );

  return (
    <article
      aria-label={animal.nome}
      className="bg-white rounded-2xl border border-[#eadede] overflow-hidden"
    >
      {/* ── Cabeçalho vermelho, em duas linhas ── Na primeira, o nome e, à
          direita, editar e excluir (só para o dono); na segunda, raça e
          código. A disponibilidade fica embaixo da foto. */}
      <header className="bg-[#9e0a24] text-white px-5 py-4 md:px-8 md:py-5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-[1.75rem] leading-none tracking-tight">
              {animal.nome}
            </h3>
            <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-md">
              {ESPECIES[animal.especie].rotulo}
            </span>
          </div>
          {ehDono && (
            <div className="flex items-center gap-2 shrink-0">
              <Botao
                variante="sobreVermelho"
                tamanho="md"
                icone="edit"
                aria-label={`Editar ${animal.nome}`}
                title="Editar"
                onClick={() => setModal("editar")}
              />
              <Botao
                variante="sobreVermelho"
                tamanho="md"
                icone="delete"
                aria-label={`Excluir ${animal.nome}`}
                title="Excluir"
                onClick={() => setModal("excluir")}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-x-2.5 gap-y-1.5 flex-wrap">
          <p className="text-sm text-white/85">
            {nomeRaca(animal)}, {SEXOS[animal.sexo].toLowerCase()},{" "}
            {textoCastracao(animal).toLowerCase()}
          </p>
          <CodigoCopiavel codigo={animal.codigo} claro />
        </div>
      </header>

      {/* ── Corpo ── */}
      <div className="p-5 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* A foto ocupa a altura que sobra na coluna; a disponibilidade
              fica embaixo dela, na mesma largura. */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
            <CarrosselFotos
              fotos={animal.fotos.map((foto) => foto.url)}
              nome={animal.nome}
            />
            {disponibilidade}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <DadosDoAnimal
              animal={animal}
              tipoSanguineo={tipoSanguineo}
              totalDoacoes={doacoes.length}
              ultimaDoacao={ultimaDoacao}
              podeRegistrar={podeAtuarComoVet}
              onVerDoacoes={() => setModal("doacoes")}
              onRegistrarDoacao={() => setModal("registrarDoacao")}
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
            documentos={animal.documentos}
            validacao={validacao}
            ehDono={ehDono}
            onEnviar={enviarNovoDocumento}
            onApagar={apagarVersao}
          />
        </div>
      </div>

      {modal === "validar" && (
        <ModalValidacao
          animal={animalAtual}
          validacao={validacao}
          onSalvar={async (dados) => {
            await validar(dados);
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

      {(modal === "doacoes" || modal === "registrarDoacao") && (
        <ModalDoacoes
          animal={animal}
          doacoes={doacoes}
          ultimaDoacao={ultimaDoacao}
          recuperacao={recuperacao}
          podeRegistrar={podeAtuarComoVet}
          iniciarRegistrando={modal === "registrarDoacao"}
          onRegistrar={registrarNovaDoacao}
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
    </article>
  );
}

export default CartaoAnimal;
