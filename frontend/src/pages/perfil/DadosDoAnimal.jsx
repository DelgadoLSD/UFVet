import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import ModalCriteriosDoacao from "../../components/ModalCriteriosDoacao";
import DadoDoador from "./DadoDoador";
import {
  ESPECIES,
  FORA_DO_IDEAL_PODE_DOAR,
  REFERENCIA_DOADOR,
  TIPOS_UNIVERSAIS,
  foraDoIdeal,
  pesoMinimo,
  resumoDoIdeal,
} from "../../regras/doacao";
import { formatarData, idadeEmAnos, textoIdade } from "../../util/datas";
import { formatarPeso } from "../../util/texto";

// A faixa de dados do cartão do animal: tipo sanguíneo, peso e idade em
// células vermelho-claras com divisões brancas, e, em linhas inteiras embaixo, o
// quanto o animal se aproxima do ideal e as doações. Peso e idade são comparados
// com o ideal da espécie, e o detalhe avisa quando estão fora. Estar fora não
// impede a doação, e a linha do ideal diz isso.

// Dentro do ideal: a linha verde, com o círculo cheio de confirmado. Fora: a
// linha vermelha, com o "i" vazado. Sempre com letras brancas, como no cartão da
// busca. Diferem no ícone e no texto, e não só na cor. Para o dono, a frase fala com ele, e deixa claro que o animal
// continua na busca e pode ser procurado.
function textoDoIdeal(animal, dentro, ehDono) {
  if (dentro) {
    return `Peso, idade e tempo desde a última doação estão dentro do ideal. Por isso, ${animal.nome} aparece antes na busca.`;
  }
  if (!ehDono) return FORA_DO_IDEAL_PODE_DOAR;
  const decisao =
    "O veterinário avalia o caso e explica os riscos, e a decisão de doar é sua.";
  return animal.disponivel
    ? `${animal.nome} continua na busca e ainda pode ajudar a salvar uma vida: quem precisar pode entrar em contato com você. ${decisao}`
    : `Isso não necessariamente impede a doação. ${decisao}`;
}

function LinhaIdeal({ animal, ultimaDoacao, ehDono }) {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);
  const fora = foraDoIdeal(animal, ultimaDoacao);
  const dentro = fora.length === 0;

  return (
    <div
      className={`col-span-2 sm:col-span-3 px-4 py-3.5 flex items-start gap-3 text-white ${
        dentro ? "bg-emerald-700" : "bg-[#9e0a24]"
      }`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[20px] mt-0.5 shrink-0"
        style={dentro ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {dentro ? "check_circle" : "info"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{resumoDoIdeal(fora, ultimaDoacao)}</p>
        <p className="mt-0.5 text-xs text-white/90 leading-relaxed">
          {textoDoIdeal(animal, dentro, ehDono)}
        </p>
      </div>
      <BotaoAjuda
        rotulo="Como funcionam os critérios de doação?"
        onClick={() => setExplicacaoAberta(true)}
        claro
      />
      {explicacaoAberta && (
        <ModalCriteriosDoacao onFechar={() => setExplicacaoAberta(false)} />
      )}
    </div>
  );
}

// As doações ocupam uma linha própria porque têm o que fazer ali: ver o
// histórico (todo mundo) e registrar uma coleta (o veterinário). Os botões
// têm o nome escrito; antes, um ícone de relógio no canto parecia mais um
// "?" de ajuda, e ninguém achava o histórico.
function LinhaDoacoes({
  animal,
  total,
  ultimaDoacao,
  recuperacao,
  podeRegistrar,
  onVerHistorico,
  onRegistrar,
}) {
  return (
    <div className="col-span-2 sm:col-span-3 bg-[#fdecee] px-4 py-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[#5b403f]">Doações</span>
        {total > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl leading-tight font-extrabold tracking-tight tabular-nums text-[#1a1c1c]">
              {total === 1 ? "1 coleta" : `${total} coletas`}
            </span>
            <span className="text-sm text-[#5b403f]">
              a última em {formatarData(ultimaDoacao)}
              {!recuperacao.intervaloCumprido &&
                `; o ideal é esperar até ${formatarData(recuperacao.idealEsperarAte)}`}
            </span>
          </p>
        ) : (
          <p className="text-base leading-[1.875rem] font-extrabold text-[#5f5e5e]">
            Nenhuma coleta ainda
          </p>
        )}
      </div>

      {(total > 0 || podeRegistrar) && (
        <div className="flex flex-wrap gap-2">
          {total > 0 && (
            <Botao
              variante="secundario"
              icone="history"
              aria-label={`Ver histórico de doações de ${animal.nome}`}
              onClick={onVerHistorico}
            >
              Ver histórico
            </Botao>
          )}
          {podeRegistrar && (
            <Botao
              icone="add"
              aria-label={`Registrar doação de ${animal.nome}`}
              onClick={onRegistrar}
            >
              Registrar doação
            </Botao>
          )}
        </div>
      )}
    </div>
  );
}

// Explicação do "?" do tipo sanguíneo: sem tipo, diz de onde ele vem; com
// tipo, o que importa na espécie. Curta, direto ao ponto.
function ajudaTipoSanguineo(animal, tipoSanguineo) {
  if (!tipoSanguineo) {
    return (
      <p>
        Ainda não confirmado em exame. Se precisar, o hospital faz a tipagem
        antes da coleta, e {animal.nome} pode doar do mesmo jeito.
      </p>
    );
  }

  if (animal.especie === "CAO") {
    return (
      <p>
        Nos cães, o que mais importa é o DEA&nbsp;1.1. Quem é DEA&nbsp;1.1
        negativo doa para quase todos os cães: é o doador universal.
      </p>
    );
  }

  return (
    <p>
      Gatos têm tipo A, B ou AB e só recebem sangue do mesmo tipo. O hospital
      sempre confere antes da transfusão.
    </p>
  );
}

function DadosDoAnimal({
  animal,
  tipoSanguineo,
  totalDoacoes,
  ultimaDoacao,
  recuperacao,
  ehDono,
  podeRegistrar,
  onVerDoacoes,
  onRegistrarDoacao,
}) {
  const ref = REFERENCIA_DOADOR[animal.especie];
  const anos = idadeEmAnos(animal.dataNascimento);
  const pesoOk = animal.pesoKg >= ref.pesoMin;
  const idadeOk = anos >= ref.idadeMin && anos <= ref.idadeMax;

  return (
    // As divisões são o fundo branco aparecendo nos vãos de 2px entre as
    // células. No celular, o tipo sanguíneo ocupa a linha de cima sozinho, e
    // peso e idade dividem a de baixo.
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-[2px] bg-white rounded-xl overflow-hidden">
      {/* O vermelho é do tipo confirmado em exame. Sem confirmação o valor
          fica cinza: assim ninguém lê um palpite como se fosse resultado. */}
      <DadoDoador
        className="col-span-2 sm:col-span-1"
        destaque={!!tipoSanguineo}
        apagado={!tipoSanguineo}
        rotulo="Tipo sanguíneo"
        valor={tipoSanguineo || "A confirmar"}
        detalhe={
          !tipoSanguineo
            ? "depende do exame de tipagem"
            : TIPOS_UNIVERSAIS.includes(tipoSanguineo)
              ? "Doador universal"
              : null
        }
        ajuda={{
          titulo: "Tipo sanguíneo",
          texto: ajudaTipoSanguineo(animal, tipoSanguineo),
        }}
      />
      <DadoDoador
        rotulo="Peso"
        valor={formatarPeso(animal.pesoKg)}
        detalhe={
          pesoOk
            ? `ideal: ${pesoMinimo(ref)} ou mais`
            : `abaixo do ideal (${pesoMinimo(ref)} ou mais)`
        }
        alerta={!pesoOk}
        ajuda={{
          titulo: "Peso ideal",
          texto: (
            <p>
              Para {ESPECIES[animal.especie].plural}, o ideal é{" "}
              {pesoMinimo(ref)} ou mais: a quantidade de sangue coletada depende
              do tamanho, e esse peso protege o doador. Abaixo disso, o
              veterinário avalia se dá para coletar com segurança.
            </p>
          ),
        }}
      />
      <DadoDoador
        rotulo="Idade"
        valor={textoIdade(anos, animal.nascimentoAproximado)}
        detalhe={
          idadeOk
            ? `faixa ideal: ${ref.idadeMin} a ${ref.idadeMax} anos`
            : `fora da faixa ideal (${ref.idadeMin} a ${ref.idadeMax} anos)`
        }
        alerta={!idadeOk}
        ajuda={{
          titulo: "Idade ideal",
          texto: (
            <p>
              Entre {ref.idadeMin} e {ref.idadeMax} anos, o animal está na
              melhor fase para doar e se recupera bem da coleta. Fora dessa
              faixa, o veterinário avalia cada caso.
            </p>
          ),
        }}
      />
      <LinhaIdeal animal={animal} ultimaDoacao={ultimaDoacao} ehDono={ehDono} />
      <LinhaDoacoes
        animal={animal}
        total={totalDoacoes}
        ultimaDoacao={ultimaDoacao}
        recuperacao={recuperacao}
        podeRegistrar={podeRegistrar}
        onVerHistorico={onVerDoacoes}
        onRegistrar={onRegistrarDoacao}
      />
    </div>
  );
}

export default DadosDoAnimal;
