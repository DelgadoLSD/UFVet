import { ErroApi } from "../erros.js";
import { registrar } from "../registro.js";

// Pedido que muda alguma coisa (POST, PUT, PATCH, DELETE) só vale se vier do
// próprio site do UFVet. É a segunda trava contra CSRF: um site malicioso
// fazendo o navegador de quem está logado agir no UFVet sem a pessoa saber.
//
// A primeira trava é o cookie do crachá com SameSite=Strict (ver token.js):
// o navegador nem o envia em pedidos vindos de outro site. Esta confere o
// cabeçalho Origin, que todo navegador põe nesses pedidos dizendo de onde
// eles saíram, e recusa quando o nome do site de origem não é o do próprio
// UFVet. Ela cobre o que o SameSite não cobre: navegadores antigos e sites
// "vizinhos" no mesmo domínio de hospedagem.
//
// Compara só o nome, sem a porta, com o que o Express tira do pedido
// (req.hostname, que considera os intermediários confiáveis). No computador,
// o Vite repassa o pedido trocando a porta (do site para a da API); publicado,
// a Cloudflare e o Render repassam com o nome do site. A porta não separa
// sites no nosso caso: ninguém publica outro site no mesmo nome.
//
// Pedido sem Origin passa: não vem de um navegador (um programa, os testes),
// e só um navegador carrega o cookie de alguém sem ela saber. Origin "null"
// (página isolada, arquivo local) não é o site, e é recusada.

const SEM_EFEITO = new Set(["GET", "HEAD", "OPTIONS"]);

function nomeDoSite(origem) {
  try {
    return new URL(origem).hostname;
  } catch {
    return null;
  }
}

export function exigirMesmaOrigem(req, res, next) {
  if (SEM_EFEITO.has(req.method)) return next();
  const origem = req.get("origin");
  if (origem === undefined) return next();
  if (nomeDoSite(origem) !== req.hostname) {
    registrar("origem_recusada", {
      metodo: req.method,
      caminho: req.path,
      origem,
    });
    throw new ErroApi(
      403,
      "Pedido recusado: ele não saiu do site do UFVet. Abra o UFVet pelo endereço dele e tente de novo.",
    );
  }
  next();
}
