import DadoDoador from "./DadoDoador";
import {
  ESPECIES,
  REFERENCIA_DOADOR,
  TIPOS_UNIVERSAIS,
} from "../../regras/doacao";
import { formatarData, idadeEmAnos, textoIdade } from "../../util/datas";
import { formatarPeso } from "../../util/texto";

// Os quatro quadros de dados do cartão do animal: tipo sanguíneo, peso, idade
// e doações. Peso e idade são comparados com os limites da espécie, e o
// detalhe avisa quando estão fora.

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
  onVerDoacoes,
}) {
  const ref = REFERENCIA_DOADOR[animal.especie];
  const anos = idadeEmAnos(animal.dataNascimento);
  const pesoOk = animal.pesoKg >= ref.pesoMin;
  const idadeOk = anos >= ref.idadeMin && anos <= ref.idadeMax;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* O destaque vermelho é do tipo confirmado em exame. Sem confirmação o
          quadro fica igual aos outros: assim ninguém lê um palpite como se
          fosse resultado. */}
      <DadoDoador
        destaque={!!tipoSanguineo}
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
        valor={textoIdade(anos)}
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
      <DadoDoador
        rotulo="Doações"
        valor={totalDoacoes}
        detalhe={
          ultimaDoacao
            ? `última em ${formatarData(ultimaDoacao)}`
            : "ainda não doou"
        }
        acao={{
          icone: "history",
          rotulo: `Ver as doações de ${animal.nome}`,
          onClick: onVerDoacoes,
        }}
      />
    </div>
  );
}

export default DadosDoAnimal;
