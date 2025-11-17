import express from 'express';
import {
  getGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame
} from '../controller/games/games.controller.js';

const router = express.Router();

// /games
router.get('/', getGames);          // GET all
router.get('/:id', getGameById);    // GET by ID
router.post('/', createGame);       // CREATE
router.put('/:id', updateGame);     // UPDATE
router.delete('/:id', deleteGame);  // DELETE

export default router;
