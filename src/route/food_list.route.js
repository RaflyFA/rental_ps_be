import express from 'express';
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
} from '../controller/food/food_list.controller.js'

const router = express.Router();

router.get('/', getFoods)
router.post('/', createFood)
router.put('/:id', updateFood)
router.delete('/:id', deleteFood)

export default router
