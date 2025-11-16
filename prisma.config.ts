import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  `mysql://${env("USER_DB")}:${env("PASSWORD_DB")}@${env("DB_URL")}/${env("DB_NAME")}`;

process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
