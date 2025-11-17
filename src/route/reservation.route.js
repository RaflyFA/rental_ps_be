import express from 'express';
import { getReservationDetail } from '../controller/reservation/reservation.controller.js';

const router = express.Router();

router.get('/:id', getReservationDetail);

export default router;