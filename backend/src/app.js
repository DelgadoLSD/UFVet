import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { config } from "./config.js";
import { rotaInexistente, tratarErros } from "./erros.js";
import { criarLimites } from "./middlewares/limites.js";
import { criarRotas } from "./rotas.js";

// Monta a API: os passos por que todo pedido passa, nesta ordem, até chegar
// ao controlador (ou a um erro). Fica separado de servidor.js para os testes
// criarem a API sem ligá-la numa porta.
//
// Sobre o CORS: ele não é ligado de propósito. O site e a API ficam no mesmo
// endereço (no computador, o Vite repassa /api; publicada, a própria API
// entrega o site, ver entregarSite), então nenhum outro site precisa chamar
// a API, e o navegador barra quem tentar.
//
// `pastaSite` é a pasta do site já montado; sem ela (no computador e nos
// testes), só a API responde.
export function criarApp({ pastaSite = config.pastaSite } = {}) {
  const app = express();

  // Atrás da hospedagem, o endereço de quem fez o pedido chega num cabeçalho
  // do intermediário; sem isto, o limite de tentativas não o enxergaria.
  app.set("trust proxy", config.proxiesConfiaveis);

  // Cabeçalhos de segurança do navegador: obrigar HTTPS depois da primeira
  // visita, não adivinhar o tipo de arquivo, não abrir a API dentro de outro
  // site, entre outros. Na política de segurança das páginas, as imagens
  // podem vir também do próprio navegador (blob:): são as prévias das fotos
  // escolhidas e o exame aberto na janela.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { "img-src": ["'self'", "data:", "blob:"] },
      },
    }),
  );

  const limites = criarLimites();
  app.use("/api", limites.geral);

  // As fotos guardadas na pasta da API (ver armazenamento.js). Só arquivos
  // dessa pasta, sem listar o que há nela e sem arquivos ocultos; caminhos
  // com "../" são barrados. Uma foto nunca muda (trocar cria outro arquivo),
  // então o navegador pode guardá-la por muito tempo.
  app.use(
    "/api/arquivos",
    express.static(config.pastaArquivos, {
      index: false,
      dotfiles: "deny",
      immutable: true,
      maxAge: "365d",
    }),
  );

  // Lê o corpo dos pedidos em JSON, com teto de tamanho. As fotos, que são
  // maiores, chegam por outro caminho (middlewares/envio.js).
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  app.use("/api", criarRotas(limites));
  if (pastaSite) entregarSite(app, pastaSite);

  app.use(rotaInexistente);
  app.use(tratarErros);
  return app;
}

// O site já montado, no mesmo endereço da API. Os arquivos de assets/ levam
// o conteúdo no nome (index-DkDloEEF.js) e mudam de nome a cada versão, então
// o navegador pode guardá-los por um ano. O index.html, não: é ele que aponta
// para a versão nova.
function entregarSite(app, pasta) {
  app.use(
    express.static(pasta, {
      index: false,
      setHeaders: (res, caminho) => {
        if (caminho.includes(`${path.sep}assets${path.sep}`)) {
          res.set("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  // As páginas do site (/buscar, /tutor/T5W2K6...) são todas o mesmo
  // index.html: quem decide o que mostrar é o React, no navegador. Ficam de
  // fora os endereços da API, que respondem com o erro da API, e os de
  // arquivo (com extensão, como /foto.png), que não são páginas.
  app.get(/^\/(?!api(?:\/|$))/, (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(pasta, "index.html"));
  });
}
