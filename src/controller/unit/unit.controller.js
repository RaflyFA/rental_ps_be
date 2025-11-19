import prisma from "../../config/prisma.js";

export async function getUnits(req, res) {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { id_unit: "asc" },
      include: {
        room: true, 
      },
    });
    res.json(units);
  } catch (error) {
    console.error("Failed to fetch unit list", error);
    res.status(500).json({ message: "Failed to fetch unit list" });
  }
}
export async function getUnitById(req, res) {
  try {
    const id = Number(req.params.id);
    const unit = await prisma.unit.findUnique({
      where: { id_unit: id },
      include: { room: true },
    });
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.json(unit);
  } catch (error) {
    console.error("Failed to fetch unit detail", error);
    res.status(500).json({ message: "Failed to fetch unit detail" });
  }
}
export async function createUnit(req, res) {
  try {
    const { nama_unit, id_room, deskripsi } = req.body;
    if (!nama_unit)
      return res.status(400).json({ message: "nama_unit is required" });
    if (!id_room)
      return res.status(400).json({ message: "id_room is required" });
    const newUnit = await prisma.unit.create({
      data: {
        nama_unit,
        id_room: Number(id_room),
        deskripsi: deskripsi ?? null,
      },
    });
    res.status(201).json(newUnit);
  } catch (error) {
    console.error("Failed to create unit", error);
    res.status(500).json({ message: "Failed to create unit" });
  }
}
export async function updateUnit(req, res) {
  try {
    const id = Number(req.params.id);
    const { nama_unit, id_room, deskripsi } = req.body;
    const updated = await prisma.unit.update({
      where: { id_unit: id },
      data: {
        ...(nama_unit !== undefined && { nama_unit }),
        ...(id_room !== undefined && { id_room: Number(id_room) }),
        ...(deskripsi !== undefined && { deskripsi }),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Unit not found" });
    }
    console.error("Failed to update unit", error);
    res.status(500).json({ message: "Failed to update unit" });
  }
}
export async function deleteUnit(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.unit.delete({
      where: { id_unit: id },
    });
    res.json({ message: "Unit deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Unit not found" });
    }
    console.error("Failed to delete unit", error);
    res.status(500).json({ message: "Failed to delete unit" });
  }
}
