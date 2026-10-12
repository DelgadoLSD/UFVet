import Ajuda from "../../components/Ajuda";
import { pronomeAnimal } from "../../regras/doacao";
import { maiuscula } from "../../util/texto";

// O "?" ao lado da disponibilidade do animal, embaixo da foto. Para o dono,
// explica como pausar as doações; para quem visita, o que a situação quer
// dizer agora. `recuperacao` vem de situacaoRecuperacao() (regras/doacao).
// `claro` é a versão para fundos vermelhos.
function AjudaDisponibilidade({
  animal,
  ehDono,
  disponivel,
  recuperacao,
  claro = false,
}) {
  const femeaNaoCastrada = animal.sexo === "FEMEA" && !animal.castrado;

  if (ehDono) {
    return (
      <Ajuda titulo="Disponibilidade para doação" claro={claro}>
        <p>
          Marque Indisponível quando {animal.nome} não puder doar por um tempo,
          como numa viagem. {maiuscula(pronomeAnimal(animal))} sai da busca até
          você marcar Disponível de novo.
        </p>
        {femeaNaoCastrada && (
          <p>
            Fêmeas não castradas não doam no cio, na gestação nem na
            amamentação.
          </p>
        )}
        {!recuperacao.apto && (
          <p>Depois de uma doação, são cerca de 3 meses de recuperação.</p>
        )}
      </Ajuda>
    );
  }

  return (
    <Ajuda titulo="Disponibilidade para doação" claro={claro}>
      {!disponivel ? (
        <p>
          O tutor pausou as doações por um tempo. Vale olhar de novo mais tarde.
        </p>
      ) : !recuperacao.apto ? (
        <p>
          {animal.nome} doou há pouco tempo e precisa de cerca de 3 meses para
          se recuperar.
        </p>
      ) : (
        <p>{animal.nome} pode doar agora, segundo o tutor.</p>
      )}
    </Ajuda>
  );
}

export default AjudaDisponibilidade;
