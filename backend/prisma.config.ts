// Configuração do Prisma CLI (migrate, generate, studio).
//
// Este arquivo vai para o git. O que não vai é a senha do banco: a URL é lida
// do .env, que o git ignora. No Prisma 7 o .env não é carregado sozinho, por
// isso o dotenv é chamado aqui.

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
