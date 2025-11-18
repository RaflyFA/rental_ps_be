import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mainRouter from './route/mainpage.js';
import reservationRouter from './route/reservation.route.js';
import membershipRouter from './route/membership.route.js';
import foodListRouter from './route/food_list.route.js';
import orderFoodRouter from './route/order_food.route.js';
import authRouter from './route/auth.route.js';
import gamesRouter from './route/games.route.js';
import unitRouter from './route/unit.route.js';
import { sessionMiddleware } from './config/session.js';

const app = express();
const port = 3000;
const allowedOrigins =
  process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
const allowAllOrigins = allowedOrigins.length === 0;
const corsOptions = {
  origin(origin, callback) {
    if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);

const apiRouter = express.Router();
apiRouter.use('/', mainRouter);
apiRouter.use('/reservations', reservationRouter);
apiRouter.use('/membership', membershipRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/foods', foodListRouter);
apiRouter.use('/order-foods', orderFoodRouter);
apiRouter.use('/games', gamesRouter);
apiRouter.use('/unit', unitRouter);


app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`SERVER BERJALAN DI PORT :  ${port}`);
});

