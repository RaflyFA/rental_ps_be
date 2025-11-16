import prisma from '../../config/prisma.js';

export async function getMemberships(req, res) {
  try {
    const records = await prisma.membership.findMany({ orderBy: { id_membership: 'asc' } });
    res.json(records);
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
