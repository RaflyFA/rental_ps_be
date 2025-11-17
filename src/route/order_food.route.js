import express from 'express';
import {
  createOrderFood,
  getOrderFoodByReservation,
} from '../controller/food/order_food.controller.js';

const router = express.Router();

router.post('/', createOrderFood);
router.get('/by-reservation/:reservationId', getOrderFoodByReservation);

export default router;