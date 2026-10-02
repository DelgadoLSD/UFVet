import { useState } from "react";
import Surgir from "./Surgir";
import Pilula from "./Pilula";
import { CONTAINER } from "./estilos";
import ModalComoFuncionaValidacao from "../../components/ModalComoFuncionaValidacao";

// Chamada final, com os dois caminhos de novo: cadastrar um doador ou buscar
// um.
function SecaoChamada() {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className={CONTAINER}>
        <div className="grid md:grid-cols-2 gap-5">
          <Surgir className="h-full">
            <div className="h-full rounded-[2rem] bg-[#fdecee] p-8 md:p-12 flex flex-col items-start">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-[#1a1c1c] mb-4">
                Cadastre seu pet como doador
              </h2>
              <p className="text-lg text-[#5b403f] leading-relaxed mb-10 max-w-md flex-1">
                Leva poucos minutos. Com os dados validados por um veterinário,
                a coleta fica mais rápida quando alguém precisar.
              </p>
              <Pilula to="/cadastrar">Cadastrar meu animal</Pilula>
            </div>
          </Surgir>

          <Surgir atraso={120} className="h-full">
            <div className="h-full rounded-[2rem] bg-[#1a1c1c] text-white p-8 md:p-12 flex flex-col items-start">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4">
                Seu animal precisa de sangue?
              </h2>
              <p className="text-lg text-white/75 leading-relaxed mb-10 max-w-md flex-1">
                Filtre por espécie, tipo sanguíneo e bairro, veja quem já foi
                validado e fale direto com o tutor do doador.{" "}
                <button
                  type="button"
                  onClick={() => setExplicacaoAberta(true)}
                  className="font-semibold text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
                >
                  Como funciona a validação?
                </button>
              </p>
              <Pilula to="/buscar" variante="branco">
                Buscar doadores
              </Pilula>
            </div>
          </Surgir>
        </div>
      </div>

      {explicacaoAberta && (
        <ModalComoFuncionaValidacao
          onFechar={() => setExplicacaoAberta(false)}
        />
      )}
    </section>
  );
}

export default SecaoChamada;
