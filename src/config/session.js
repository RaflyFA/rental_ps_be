import session from 'express-session';
import mysqlSession from 'express-mysql-session';

const sessionSecret = process.env.SESSION_SECRET ?? 'default-session-secret';
const [dbHost = 'localhost', dbPort = '3306'] = (process.env.DB_URL ?? 'localhost:3306').split(':');

const MySQLStore = mysqlSession(session);
const store = new MySQLStore({
  host: dbHost,
  port: Number(dbPort),
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.DB_NAME,
});

export const sessionMiddleware = session({
  name: 'rentalps.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8,
  },
});
