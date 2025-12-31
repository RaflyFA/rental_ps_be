import prisma from '../../config/prisma.js';

export async function getMemberships(req, res) {
  try {
    const fetchAll = req.query.all === "true";
    const search = (req.query.search || "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const where = search
      ? {
          nama_tier: { contains: search },
        }
      : {};

    if (fetchAll) {
      const records = await prisma.membership.findMany({
        where,
        orderBy: { id_membership: "asc" },
      });
      return res.json(records);
    }

    const [records, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        orderBy: { id_membership: "asc" },
        skip,
        take: limit,
      }),
      prisma.membership.count({ where }),
    ]);

    res.json({
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Failed to fetch membership list', error);
    res.status(500).json({ message: 'Failed to fetch membership list' });
  }
}

export async function getMembershipById(req, res) {
  try {
    const id = Number(req.params.id);
    const record = await prisma.membership.findUnique({ where: { id_membership: id } });
    if (!record) return res.status(404).json({ message: 'Membership not found' });
    res.json(record);
  } catch (error) {
    console.error('Failed to fetch membership detail', error);
    res.status(500).json({ message: 'Failed to fetch membership detail' });
  }
}

export async function createMembership(req, res) {
  try {
    const { nama_tier, diskon_persen, poin_bonus } = req.body;
    if (!nama_tier) return res.status(400).json({ message: 'nama_tier is required' });
    const newRecord = await prisma.membership.create({
      data: {
        nama_tier,
        diskon_persen: toNullableNumber(diskon_persen),
        poin_bonus: toNullableNumber(poin_bonus),
      },
    });
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Failed to create membership', error);
    res.status(500).json({ message: 'Failed to create membership' });
  }
}

export async function updateMembership(req, res) {
  try {
    const id = Number(req.params.id);
    const { nama_tier, diskon_persen, poin_bonus } = req.body;
    const updated = await prisma.membership.update({
      where: { id_membership: id },
      data: {
        ...(nama_tier !== undefined && { nama_tier }),
        diskon_persen: toNullableNumber(diskon_persen),
        poin_bonus: toNullableNumber(poin_bonus),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Membership not found' });
    }
    console.error('Failed to update membership', error);
    res.status(500).json({ message: 'Failed to update membership' });
  }
}

export async function deleteMembership(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.membership.delete({ where: { id_membership: id } });
    res.json({ message: 'Membership deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Membership not found' });
    }
    console.error('Failed to delete membership', error);
    res.status(500).json({ message: 'Failed to delete membership' });
  }
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
