import Header from "../components/Header";
import Footer from "../components/Footer";
import SecaoAbertura from "./inicio/SecaoAbertura";
import SecaoPorQue from "./inicio/SecaoPorQue";
import SecaoPodeDoar from "./inicio/SecaoPodeDoar";
import SecaoComoEADoacao from "./inicio/SecaoComoEADoacao";
import SecaoMitos from "./inicio/SecaoMitos";
import SecaoChamada from "./inicio/SecaoChamada";
import SecaoFontes from "./inicio/SecaoFontes";

// Página inicial: apresenta o UFVet e explica a doação de sangue animal, de
// cima para baixo. Cada seção fica num arquivo em pages/inicio/.
function InicioPage() {
  return (
    <>
      <Header />
      <main>
        <SecaoAbertura />
        <SecaoPorQue />
        <SecaoPodeDoar />
        <SecaoComoEADoacao />
        <SecaoMitos />
        <SecaoChamada />
        <SecaoFontes />
      </main>
      <Footer />
    </>
  );
}

export default InicioPage;
