import express from 'express';
import {
  listReservations,
  getReservationDetail,
  getReservationWithOrders,
  createReservation,
  updateReservation,
  deleteReservation,
  payReservation
} from '../controller/reservation/reservation.controller.js';

const router = express.Router();

router.get('/', listReservations);
router.get('/:id', getReservationDetail);
router.get('/:id/with-orders', getReservationWithOrders);
router.post('/', createReservation);
router.post('/pay/:id', payReservation);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);


export default router;