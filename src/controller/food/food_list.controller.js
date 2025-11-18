import prisma from '../../config/prisma.js';

export async function getFoods(req, res) {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);   // default page 1
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10)); // default 10 / max 100
    const search = (req.query.search || '').trim();
    const skip = (page - 1) * limit;
    const where = search
      ? { nama_makanan: { contains: search, mode: 'insensitive' } }
      : {};
    const [rows, total] = await Promise.all([
      prisma.food_list.findMany({
        where,
        orderBy: { id_food: 'asc' },
        skip,
        take: limit,
      }),
      prisma.food_list.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch food list', error);
    res.status(500).json({ message: 'Failed to fetch food list' });
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
