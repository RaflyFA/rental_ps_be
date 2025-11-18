import "dotenv/config";
import pkg from '@prisma/client';

const { PrismaClient } = pkg;



const {
  DATABASE_URL,
  USER_DB,
  PASSWORD_DB,
  DB_URL,
  DB_NAME,
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

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;
