import { Navigate, useLocation } from "react-router-dom";
import { useEstadoSessao } from "../servicos/sessao";

// Página que exige login (o próprio perfil, a conta). Sem ninguém logado, a
// pessoa vai para "Entrar" e, depois de entrar, volta para onde ia.
//
// Isto só organiza a navegação. Quem protege os dados de verdade é a API,
// que confere o crachá de sessão em cada pedido.
function RotaProtegida({ children }) {
  const { usuario, carregando } = useEstadoSessao();
  const local = useLocation();

  // Ainda perguntando à API quem está logado: não mostra nada por um
  // instante, em vez de mandar para "Entrar" quem já está logado.
  if (carregando) return null;

  if (!usuario) {
    const voltar = encodeURIComponent(local.pathname + local.search);
    return <Navigate to={`/login?voltar=${voltar}`} replace />;
  }
  return children;
}

export default RotaProtegida;
