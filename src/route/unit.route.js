import express from "express";
import {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitGames,
  addGameToUnit,
  removeGameFromUnit
} from "../controller/unit/unit.controller.js";

const router = express.Router();

router.get("/", getUnits);
router.get("/:id", getUnitById);
router.post("/", createUnit);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);
router.get("/:id/games", getUnitGames);
router.post("/games", addGameToUnit);
router.delete("/games/:id", removeGameFromUnit);

export default router;
