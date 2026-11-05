import Ajuda from "../../components/Ajuda";
import { finalDoGenero, pronomeAnimal } from "../../regras/doacao";
import { maiuscula } from "../../util/texto";

// O "?" ao lado da disponibilidade do animal, embaixo da foto. Para o dono,
// explica como pausar as doações; para quem visita, o que a situação quer
// dizer agora. Só o tutor muda a disponibilidade: uma doação recente não muda.
// `recuperacao` vem de situacaoRecuperacao() (regras/doacao).
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
          Marque Indisponível quando não quiser que {animal.nome} seja procurad
          {finalDoGenero(animal)} por um tempo, como numa viagem.{" "}
          {maiuscula(pronomeAnimal(animal))} sai da busca até você marcar
          Disponível de novo.
        </p>
        {femeaNaoCastrada && (
          <p>
            Em fêmeas não castradas, o cio, a gestação e a amamentação costumam
            adiar a doação.
          </p>
        )}
        {!recuperacao.intervaloCumprido && (
          <p>
            Depois de uma doação, o ideal é esperar cerca de 3 meses. Até lá,{" "}
            {animal.nome} continua disponível, a menos que você marque o
            contrário. A decisão é sua, junto com o veterinário.
          </p>
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
      ) : !recuperacao.intervaloCumprido ? (
        <p>
          {animal.nome} doou há pouco tempo. O ideal é esperar cerca de 3 meses,
          mas, em uma urgência, o tutor e o veterinário podem avaliar.
        </p>
      ) : (
        <p>
          {animal.nome} está disponível, segundo o tutor. Antes de qualquer
          coleta, o veterinário avalia.
        </p>
      )}
    </Ajuda>
  );
}

export default AjudaDisponibilidade;
