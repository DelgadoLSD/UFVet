import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao, {
  BotaoGoogle,
} from "../components/LayoutAutenticacao";
import { apagarAviso, entrar, useEstadoSessao } from "../servicos/sessao";
import { destinoSeguro } from "../util/navegacao";
// "Shelter dog ready for adoption", foto de Michael G (Unsplash, uso livre)
import fotoCaoVermelho from "../assets/auth/cao-vermelho.jpg";

// Página de entrar, com e-mail e senha (F2). Depois de entrar, a pessoa volta
// para a página de onde veio (?voltar=...) ou vai para o próprio perfil.
function LoginPage() {
  const { usuario, aviso: avisoDaSessao } = useEstadoSessao();
  const navegar = useNavigate();
  // Por que a pessoa saiu da conta sem pedir (a sessão venceu, por exemplo).
  // Fica na tela enquanto ela estiver aqui; na sessão, é apagado logo.
  const [aviso] = useState(avisoDaSessao);
  useEffect(() => apagarAviso(), []);
  const [parametros] = useSearchParams();
  const destino = destinoSeguro(parametros.get("voltar"));

  const [dados, setDados] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const mudar = (campo, valor) =>
    setDados((prev) => ({ ...prev, [campo]: valor }));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await entrar(dados.email, dados.senha);
      navegar(destino, { replace: true });
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  };

  // Quem já está logado e abre "Entrar" segue direto.
  if (usuario && !enviando) return <Navigate to={destino} replace />;

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
      {aviso && (
        <p
          role="status"
          className="mt-6 flex items-start gap-2 rounded-xl bg-[#f4efef] px-3.5 py-3 text-sm text-[#1a1c1c] leading-snug"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] text-[#5f5e5e] shrink-0"
          >
            info
          </span>
          {aviso}
        </p>
      )}

      <form onSubmit={enviar} className="mt-10 space-y-5">
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
          value={dados.email}
          onChange={(e) => mudar("email", e.target.value)}
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
        <AvisoErro>{erro}</AvisoErro>
        <div className="pt-3">
          <Botao
            type="submit"
            tamanho="lg"
            className="w-full"
            disabled={enviando}
          >
            {enviando ? "Entrando…" : "Entrar"}
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
