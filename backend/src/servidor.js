import { criarApp } from "./app.js";
import { banco } from "./banco.js";
import { config } from "./config.js";

// Liga a API numa porta (npm run dev no computador, npm start publicado).

const servidor = criarApp().listen(config.porta, (erro) => {
  if (erro) throw erro;
  console.log(`API do UFVet no ar em http://localhost:${config.porta}/api`);
});

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
