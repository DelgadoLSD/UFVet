import { useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao, {
  BotaoGoogle,
} from "../components/LayoutAutenticacao";
// "Shelter dog ready for adoption", foto de Michael G (Unsplash, uso livre)
import fotoCaoVermelho from "../assets/auth/cao-vermelho.jpg";

// Página de entrar: CPF e senha. Por enquanto o envio só avisa; na
// integração, ele passa a chamar a API, que confere a senha e abre a sessão.
function LoginPage() {
  const [dados, setDados] = useState({ cpf: "", senha: "" });

  const mudar = (campo, valor) =>
    setDados((prev) => ({ ...prev, [campo]: valor }));

  const entrar = (e) => {
    e.preventDefault();
    alert("Login enviado! (integração com back-end em breve)");
  };

  return (
    <LayoutAutenticacao
      foto={fotoCaoVermelho}
      fotoPosicao="center 20%"
      corFundo="#a1050e"
    >
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c]">
        Entrar
      </h1>
      <p className="mt-3 text-[#5b403f] leading-relaxed">
        Acesse sua conta para buscar doadores ou cuidar do cadastro dos seus
        animais.
      </p>

      <form onSubmit={entrar} className="mt-10 space-y-5">
        <Campo
          id="cpf"
          rotulo="CPF"
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="username"
          required
          value={dados.cpf}
          onChange={(e) => mudar("cpf", e.target.value)}
        />
        <Campo
          id="senha"
          rotulo="Senha"
          senha
          placeholder="Sua senha"
          autoComplete="current-password"
          required
          value={dados.senha}
          onChange={(e) => mudar("senha", e.target.value)}
          extra={
            // A recuperação de senha ainda não existe.
            <a
              href="#"
              className="text-sm font-semibold text-[#8e001b] hover:underline"
            >
              Esqueceu a senha?
            </a>
          }
        />
        <div className="pt-3">
          <Botao type="submit" tamanho="lg" className="w-full">
            Entrar
          </Botao>
        </div>
      </form>

      <BotaoGoogle>Entrar com Google</BotaoGoogle>

      <p className="mt-10 text-sm text-[#5f5e5e]">
        Ainda não tem conta?{" "}
        <Link
          to="/cadastrar"
          className="font-semibold text-[#8e001b] hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </LayoutAutenticacao>
  );
}

export default LoginPage;
