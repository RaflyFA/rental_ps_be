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
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listReservations);
router.get('/:id', getReservationDetail);
router.get('/:id/with-orders', getReservationWithOrders);
router.post('/', ensureAuthenticated, createReservation);
router.post('/pay/:id', ensureAuthenticated, payReservation);
router.put('/:id', ensureAuthenticated, updateReservation);
router.delete('/:id', ensureAuthenticated, deleteReservation);


export default router;
