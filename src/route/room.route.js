import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controller/room.controller.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
