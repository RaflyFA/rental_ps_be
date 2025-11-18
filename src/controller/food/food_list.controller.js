import prisma from '../../config/prisma.js';

export async function getFoods(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const search = (req.query.search || '').trim();

    const skip = (page - 1) * limit;

    const where = search
      ? {
          nama_makanan: {
            contains: search,
            mode: 'insensitive',
          },
        }
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

export async function getFoodById(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid food id' });
    }

    const record = await prisma.food_list.findUnique({
      where: { id_food: id },
    });

    if (!record) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Failed to fetch food detail', error);
    res.status(500).json({ message: 'Failed to fetch food detail' });
  }
}

export async function createFood(req, res) {
  try {
    const { nama_makanan, harga } = req.body;

    if (!nama_makanan || nama_makanan.trim() === '') {
      return res.status(400).json({ message: 'nama_makanan is required' });
    }

    const price = Number(harga);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: 'harga must be a positive number' });
    }

    const created = await prisma.food_list.create({
      data: {
        nama_makanan: nama_makanan.trim(),
        harga: price,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create food', error);
    res.status(500).json({ message: 'Failed to create food' });
  }
}

export async function updateFood(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid food id' });
    }

    const { nama_makanan, harga } = req.body;

    const data = {};

    if (nama_makanan !== undefined) {
      if (!nama_makanan || nama_makanan.trim() === '') {
        return res.status(400).json({ message: 'nama_makanan cannot be empty' });
      }
      data.nama_makanan = nama_makanan.trim();
    }

    if (harga !== undefined) {
      const price = Number(harga);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: 'harga must be a positive number' });
      }
      data.harga = price;
    }

    const updated = await prisma.food_list.update({
      where: { id_food: id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Food not found' });
    }
    console.error('Failed to update food', error);
    res.status(500).json({ message: 'Failed to update food' });
  }
}

export async function deleteFood(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid food id' });
    }

    await prisma.food_list.delete({
      where: { id_food: id },
    });

    res.json({ message: 'Food deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Food not found' });
    }
    console.error('Failed to delete food', error);
    res.status(500).json({ message: 'Failed to delete food' });
  }
}
