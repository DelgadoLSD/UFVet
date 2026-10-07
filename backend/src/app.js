import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { rotaInexistente, tratarErros } from "./erros.js";
import { criarLimites } from "./middlewares/limites.js";
import { criarRotas } from "./rotas.js";

// Monta a API: os passos por que todo pedido passa, nesta ordem, até chegar
// ao controlador (ou a um erro). Fica separado de servidor.js para os testes
// criarem a API sem ligá-la numa porta.
//
// Sobre o CORS: ele não é ligado de propósito. O site e a API ficam no mesmo
// endereço (no computador, o Vite repassa /api; publicado, a hospedagem faz o
// mesmo), então nenhum outro site precisa chamar a API, e o navegador barra
// quem tentar.
export function criarApp() {
  const app = express();

  // Atrás da hospedagem, o endereço de quem fez o pedido chega num cabeçalho
  // do intermediário; sem isto, o limite de tentativas não o enxergaria.
  app.set("trust proxy", config.proxiesConfiaveis);

  // Cabeçalhos de segurança do navegador: obrigar HTTPS depois da primeira
  // visita, não adivinhar o tipo de arquivo, não abrir a API dentro de outro
  // site, entre outros.
  app.use(helmet());

  const limites = criarLimites();
  app.use("/api", limites.geral);

  // Lê o corpo dos pedidos em JSON, com teto de tamanho (fotos e exames, que
  // são maiores, vão ter caminho próprio).
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  app.use("/api", criarRotas(limites));

  app.use(rotaInexistente);
  app.use(tratarErros);
  return app;
}
