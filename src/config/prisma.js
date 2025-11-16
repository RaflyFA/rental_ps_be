import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ??
  `mysql://${process.env.USER_DB}:${process.env.PASSWORD_DB}@${process.env.DB_URL}/${process.env.DB_NAME}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;
