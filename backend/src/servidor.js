import { criarApp } from "./app.js";
import { banco } from "./banco.js";
import { conferirScript } from "./carteiro.js";
import { config } from "./config.js";
import { registrar } from "./registro.js";

// Liga a API numa porta (npm run dev no computador, npm start publicado).

const servidor = criarApp().listen(config.porta, (erro) => {
  if (erro) throw erro;
  console.log(`API do UFVet no ar em http://localhost:${config.porta}/api`);
  if (config.email.scriptUrl) conferirCarteiro();
});

// Confere, logo depois de ligar, se o script do Google aceita a senha, sem
// mandar e-mail nenhum (ver conferirScript). O resultado fica no registro
// da hospedagem: "carteiro_pronto", ou "carteiro_com_problema" com o que
// conferir. A API continua no ar nos dois casos.
async function conferirCarteiro() {
  const problema = await conferirScript();
  registrar(problema ? "carteiro_com_problema" : "carteiro_pronto", {
    ...(problema && { motivo: problema }),
  });
}

// Ao desligar (Ctrl+C ou a hospedagem reiniciando), termina os pedidos em
// andamento e fecha as conexões com o banco antes de sair.
function desligar() {
  servidor.close(async () => {
    await banco.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", desligar);
process.on("SIGTERM", desligar);
