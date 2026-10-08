import Botao from "../../components/Botao";
import DadoDoador from "./DadoDoador";
import {
  ESPECIES,
  REFERENCIA_DOADOR,
  TIPOS_UNIVERSAIS,
} from "../../regras/doacao";
import { formatarData, idadeEmAnos, textoIdade } from "../../util/datas";
import { formatarPeso } from "../../util/texto";

// A faixa de dados do cartão do animal: tipo sanguíneo, peso e idade em
// células vermelho-claras com divisões brancas, e as doações numa linha
// inteira embaixo. Peso e idade são comparados com os limites da espécie, e o
// detalhe avisa quando estão fora.

// As doações ocupam uma linha própria porque têm o que fazer ali: ver o
// histórico (todo mundo) e registrar uma coleta (o veterinário). Os botões
// têm o nome escrito; antes, um ícone de relógio no canto parecia mais um
// "?" de ajuda, e ninguém achava o histórico.
function LinhaDoacoes({
  animal,
  total,
  ultimaDoacao,
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
// tipo, explica a tipagem da espécie.
function ajudaTipoSanguineo(animal, tipoSanguineo) {
  if (!tipoSanguineo) {
    return (
      <>
        <p>
          O tipo sanguíneo de {animal.nome} ainda não foi registrado. Ele vem do
          exame de tipagem, e quem anota no perfil é o veterinário que assina a
          validação.
        </p>
        <p>
          Até lá, o hospital faz a tipagem antes da coleta — o animal pode doar
          do mesmo jeito.
        </p>
      </>
    );
  }

  if (animal.especie === "CAO") {
    return (
      <>
        <p>
          Assim como as pessoas, cães têm tipos de sangue. O mais importante é o
          DEA 1.1.
        </p>
        <p>
          Cães DEA 1.1 negativo são chamados de doadores universais, porque
          podem doar para a maioria dos cães. O hospital sempre confirma a
          compatibilidade antes da transfusão.
        </p>
      </>
    );
  }

  return (
    <>
      <p>Gatos podem ter sangue do tipo A, B ou AB.</p>
      <p>
        Diferente dos cães, eles já nascem com defesas contra o tipo que não têm
        — por isso o doador precisa ser compatível com o gato que vai receber. O
        hospital sempre faz esse teste antes da transfusão.
      </p>
    </>
  );
}

function DadosDoAnimal({
  animal,
  tipoSanguineo,
  totalDoacoes,
  ultimaDoacao,
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
            ? `mínimo: ${ref.pesoMin} kg`
            : `abaixo do mínimo (${ref.pesoMin} kg)`
        }
        alerta={!pesoOk}
        ajuda={{
          titulo: "Por que o peso importa?",
          texto: (
            <p>
              A quantidade de sangue coletada acompanha o tamanho do animal. Por
              isso existe um peso mínimo — {ref.pesoMin} kg para{" "}
              {ESPECIES[animal.especie].plural} — para que a doação seja segura
              para o próprio doador.
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
            : `fora da faixa (${ref.idadeMin} a ${ref.idadeMax} anos)`
        }
        alerta={!idadeOk}
        ajuda={{
          titulo: "Por que a idade importa?",
          texto: (
            <p>
              Animais adultos, entre {ref.idadeMin} e {ref.idadeMax} anos,
              costumam estar na melhor fase para doar e se recuperam bem da
              coleta.
            </p>
          ),
        }}
      />
      <LinhaDoacoes
        animal={animal}
        total={totalDoacoes}
        ultimaDoacao={ultimaDoacao}
        podeRegistrar={podeRegistrar}
        onVerHistorico={onVerDoacoes}
        onRegistrar={onRegistrarDoacao}
      />
    </div>
  );
}

export default DadosDoAnimal;
