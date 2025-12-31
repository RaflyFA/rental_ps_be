import prisma from '../../config/prisma.js';

const PAGE_SIZE = 10;

const customerInclude = {
  membership: {
    select: {
      id_membership: true,
      nama_tier: true,
      diskon_persen: true,
      poin_bonus: true,
    },
  },
};

const shapeCustomer = (record) => {
  if (!record) return null;
  return {
    id_customer: record.id_customer,
    nama: record.nama,
    no_hp: record.no_hp,
    membership_id: record.membership_id,
    membership: record.membership ?? null,
  };
};

const membershipExists = async (membershipId) => {
  if (membershipId === undefined) return true;
  const record = await prisma.membership.findUnique({
    where: { id_membership: membershipId },
    select: { id_membership: true },
  });
  return Boolean(record);
};

const sanitizeNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value);
};

const parseMembershipId = (value) => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error('INVALID_MEMBERSHIP_ID');
  }
  return parsed;
};

export async function getCustomers(req, res) {
  try {
    const fetchAll = req.query.all === 'true';
    const search = (req.query.search || '').trim();
    const where = search
      ? {
          OR: [
            { nama: { contains: search } },
            { no_hp: { contains: search } },
          ],
        }
      : {};
    if (fetchAll) {
      const records = await prisma.customer.findMany({
        where,
        orderBy: { id_customer: 'asc' },
        include: customerInclude,
      });
      const shaped = records.map(shapeCustomer);
      return res.json({
        data: shaped,
        pagination: {
          page: 1,
          pageSize: shaped.length,
          totalItems: shaped.length,
          totalPages: 1,
          hasNextPage: false,
        },
        meta: {
          page: 1,
          limit: shaped.length,
          total: shaped.length,
          totalPages: 1,
        },
      });
    }
    const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
    const skip = (page - 1) * PAGE_SIZE;
    const [records, totalItems] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: { id_customer: 'asc' },
        include: customerInclude,
      }),
      prisma.customer.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    res.json({
      data: records.map(shapeCustomer),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
        hasNextPage: skip + records.length < totalItems,
      },
      meta: {
        page,
        limit: PAGE_SIZE,
        total: totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch customer list', error);
    res.status(500).json({ message: 'Failed to fetch customer list' });
  }
}

export async function getCustomerById(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid customer id' });
    }
    const record = await prisma.customer.findUnique({
      where: { id_customer: id },
      include: customerInclude,
    });
    if (!record) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(shapeCustomer(record));
  } catch (error) {
    console.error('Failed to fetch customer detail', error);
    res.status(500).json({ message: 'Failed to fetch customer detail' });
  }
}

export async function createCustomer(req, res) {
  try {
    const { nama, no_hp, membership_id } = req.body;
    if (!nama) {
      return res.status(400).json({ message: 'nama is required' });
    }
    if (membership_id === undefined) {
      return res.status(400).json({ message: 'membership_id is required' });
    }
    let membershipId;
    try {
      membershipId = parseMembershipId(membership_id);
    } catch (error) {
      if (error.message === 'INVALID_MEMBERSHIP_ID') {
        return res.status(400).json({ message: 'membership_id must be a valid integer' });
      }
      throw error;
    }
    const exists = await membershipExists(membershipId);
    if (!exists) {
      return res.status(400).json({ message: 'membership_id tidak ditemukan' });
    }
    const newRecord = await prisma.customer.create({
      data: {
        nama,
        membership_id: membershipId,
        no_hp: sanitizeNullableString(no_hp),
      },
      include: customerInclude,
    });
    res.status(201).json(shapeCustomer(newRecord));
  } catch (error) {
    console.error('Failed to create customer', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'membership_id tidak ditemukan' });
    }
    res.status(500).json({ message: 'Failed to create customer' });
  }
}

export async function updateCustomer(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid customer id' });
    }
    const { nama, no_hp, membership_id } = req.body;
    const data = {};
    if (nama !== undefined) data.nama = nama;
    if (no_hp !== undefined) data.no_hp = sanitizeNullableString(no_hp);
    if (membership_id !== undefined) {
      try {
        data.membership_id = parseMembershipId(membership_id);
      } catch (error) {
        if (error.message === 'INVALID_MEMBERSHIP_ID') {
          return res.status(400).json({ message: 'membership_id must be a valid integer' });
        }
        throw error;
      }
      const exists = await membershipExists(data.membership_id);
      if (!exists) {
        return res.status(400).json({ message: 'membership_id tidak ditemukan' });
      }
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const updated = await prisma.customer.update({
      where: { id_customer: id },
      data,
      include: customerInclude,
    });
    res.json(shapeCustomer(updated));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'membership_id tidak ditemukan' });
    }
    console.error('Failed to update customer', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
}

export async function deleteCustomer(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid customer id' });
    }
    await prisma.customer.delete({ where: { id_customer: id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    console.error('Failed to delete customer', error);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
}
