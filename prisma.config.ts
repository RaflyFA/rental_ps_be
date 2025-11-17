import "dotenv/config";
import { defineConfig } from "prisma/config";

const {
  DATABASE_URL,
  USER_DB,
  PASSWORD_DB,
  DB_URL = "localhost:3306",
  DB_NAME = "rental_ps",
} = process.env;

const credentials = (() => {
  if (USER_DB && PASSWORD_DB) {
    return `${USER_DB}:${PASSWORD_DB}`;
  }

  if (USER_DB) {
    return USER_DB;
  }

  return "";
})();

const authSegment = credentials ? `${credentials}@` : "";

const databaseUrl =
  DATABASE_URL ?? `mysql://${authSegment}${DB_URL}/${DB_NAME}`;

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
