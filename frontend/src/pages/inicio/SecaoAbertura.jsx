import Pilula from "./Pilula";
import { CONTAINER } from "./estilos";
import fotoAbertura from "../../assets/inicio/abertura-cao.jpg";

// Primeira tela da página inicial: a frase principal e os dois caminhos do
// site, para quem precisa de um doador e para quem quer cadastrar o seu.
function SecaoAbertura() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      <img
        src={fotoAbertura}
        className="absolute right-0 top-0 h-full w-2/3 object-contain object-right"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0" />
      <div className={`${CONTAINER} relative z-10`}>
        <div className="max-w-2xl text-left">
          <h1 className="text-5xl md:text-7xl mb-8 leading-[1.05] font-extrabold tracking-tighter text-white">
            Seu pet pode <br />
            <span className="text-[#b7102a] italic">salvar uma vida!</span>
          </h1>
          <p className="text-lg md:text-xl mb-12 max-w-xl leading-relaxed text-white">
            Conectamos tutores de animais que precisam de transfusão a doadores
            voluntários em uma rede de solidariedade técnica e segura.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <Pilula to="/buscar">Preciso de um doador</Pilula>
            <Pilula to="/cadastrar" variante="branco">
              Quero cadastrar meu animal
            </Pilula>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecaoAbertura;
