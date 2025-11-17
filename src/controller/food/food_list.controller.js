import prisma from '../../config/prisma.js';

export async function getFoods(req, res) {
  try {
    const foods = await prisma.food_list.findMany({
      orderBy: { id_food: 'asc' },
    })

    const normalized = foods.map((f) => ({
      ...f,
      harga: Number(f.harga)
    }))
    res.json(normalized)
  } catch (error) {
    console.error('Failed to fetch food list', error)
    res.status(500).json({ message: 'Failed to fetch food list' })
  }
}
export async function createFood(req, res) {
  try {
    const { nama_makanan, harga } = req.body
    if (!nama_makanan) {
      return res.status(400).json({ message: 'nama_makanan is required' })
    }
    const newFood = await prisma.food_list.create({
      data: {
        nama_makanan,
        harga: Number(harga),
      },
    })
    res.status(201).json({
      ...newFood,
      harga: Number(newFood.harga),
    })
  } catch (error) {
    console.error('Failed to create food', error)
    res.status(500).json({ message: 'Failed to create food' })
  }
}
export async function updateFood(req, res) {
  try {
    const id = Number(req.params.id)
    const { nama_makanan, harga } = req.body

    const updated = await prisma.food_list.update({
      where: { id_food: id },
      data: {
        ...(nama_makanan !== undefined && { nama_makanan }),
        ...(harga !== undefined && { harga: Number(harga) }),
      },
    })
    res.json({
      ...updated,
      harga: Number(updated.harga),
    })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Food not found' })
    }
    console.error('Failed to update food', error)
    res.status(500).json({ message: 'Failed to update food' })
  }
}
export async function deleteFood(req, res) {
  try {
    const id = Number(req.params.id)
    await prisma.food_list.delete({ where: { id_food: id } })
    res.json({ message: 'Food deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Food not found' })
    }
    console.error('Failed to delete food', error)
    res.status(500).json({ message: 'Failed to delete food' })
  }
}
