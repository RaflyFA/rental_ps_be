import moment from 'moment';
import prisma from '../../config/prisma.js';

const defaultPrice = `7000`

function shapeReservation(record) {
  // console.log('shapeReservation record', record); // Optional: matikan log biar bersih
  if (!record) return null;

  return {
    id_reservation: record.id_reservation,
    customer_id: record.customer_id ?? null,
    id_room: record.id_room,
    customer_name: record.customer?.nama ?? null,
    nama_room: record.room?.nama_room ?? null,

    waktu_mulai: record.waktu_mulai,
    waktu_selesai: record.waktu_selesai,
    durasi: record.durasi,
    total_harga: record.total_harga,
    // Cek status bayar berdasarkan keberadaan relasi payment
    payment_status: record.payment?.id_payment ? "LUNAS" : "BELUM DIBAYAR",
    payment_method: record.payment?.payment_method ?? null,
  };
}

function shapeOrderFood(row) {
  return {
    id_order: row.id_order,
    reservation_id: row.reservation_id,
    food_id: row.food_id,
    jumlah: row.jumlah,
    food: row.food_list
      ? {
          id_food: row.food_list.id_food,
          nama_makanan: row.food_list.nama_makanan,
          harga: row.food_list.harga,
        }
      : null,
  };
}

// ==========================================
// 1. LIST RESERVATIONS (UPDATED FOR PAGINATION)
// ==========================================
export async function listReservations(req, res) {
  try {
    const { date, page, limit, unpaid } = req.query;

    // --- SKENARIO 1: MODE TIMELINE (Berdasarkan Tanggal) ---
    // Digunakan untuk tampilan Grid/Timeline di Dashboard/Reservation utama
    // Return: Array of Objects
    if (date) {
      const where = {};
      where.tanggal_reservasi = date;

      const records = await prisma.reservation.findMany({
        where,
        include: {
          customer: { select: { nama: true } },
          room: { select: { nama_room: true } },
          payment: true, // Include payment untuk cek status
        },
        orderBy: [
          { waktu_mulai: 'asc' },
          { id_reservation: 'asc' },
        ],
      });
      
      // Langsung return array (Logic lama)
      return res.json(records.map(shapeReservation));
    }

    // --- SKENARIO 2: MODE HISTORY (Pagination & Filter) ---
    // Digunakan untuk tab "History" dan "Unpaid Only"
    // Return: { data: [], pagination: {} }
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter Unpaid: Cari yang payment_id-nya NULL
    if (unpaid === 'true') {
      where.payment_id = null;
    }

    // Gunakan Transaction untuk efisiensi (Hitung Total & Ambil Data sekaligus)
    const [total, records] = await prisma.$transaction([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        include: {
          customer: { select: { nama: true } },
          room: { select: { nama_room: true } },
          payment: true,
        },
        orderBy: { id_reservation: 'desc' }, // Urutkan dari yang paling baru
        skip: skip,
        take: limitNum,
      }),
    ]);

    // Return format Object dengan metadata pagination
    res.json({
      data: records.map(shapeReservation),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Failed to list reservations', error);
    res.status(500).json({ message: 'Failed to list reservations' });
  }
}

// ==========================================
// 2. GET DETAIL
// ==========================================
export async function getReservationDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation id' });
    }
    const record = await prisma.reservation.findUnique({
      where: { id_reservation: id },
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
        payment: true, // Pastikan payment di-include juga disini
      },
    });
    if (!record) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(shapeReservation(record));
  } catch (error) {
    console.error('Failed to fetch reservation detail', error);
    res.status(500).json({ message: 'Failed to fetch reservation detail' });
  }
}

// ==========================================
// 3. GET WITH ORDERS
// ==========================================
export async function getReservationWithOrders(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation id' });
    }
    const record = await prisma.reservation.findUnique({
      where: { id_reservation: id },
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
        payment: true,
        order_food: {
          include: {
            food_list: true,
          },
        },
      },
    });
    if (!record) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    const shaped = shapeReservation(record);
    const orders = (record.order_food || []).map(shapeOrderFood);
    res.json({
      ...shaped,
      orders,
    });
  } catch (error) {
    console.error('Failed to fetch reservation with orders', error);
    res.status(500).json({ message: 'Failed to fetch reservation with orders' });
  }
}

// Helpers untuk Create/Update
function buildDateTime(dateStr, timeStr) {
  const dt = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', true);
  if (!dt.isValid()) {
    throw new Error('INVALID_DATE_TIME');
  }
  return dt;
}

function toUTCDatePreservingLocalInput(momentObj) {
  return new Date(momentObj.valueOf() + momentObj.utcOffset() * 60 * 1000);
}

async function resolveCustomerId({ customer_id, customer_name }) {
  let cid = customer_id ? Number(customer_id) : null;
  if (Number.isFinite(cid)) return cid;
  if (customer_name) {
    let customer = await prisma.customer.findFirst({
      where: { nama: customer_name },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { nama: customer_name },
      });
    }
    return customer.id_customer;
  }
  return null;
}

async function resolveRoomId({ room_id, nama_room }) {
  let rid = room_id ? Number(room_id) : null;
  if (Number.isFinite(rid)) return rid;

  if (nama_room) {
    const room = await prisma.room.findFirst({
      where: { nama_room },
    });
    if (!room) {
      throw new Error(`ROOM_NOT_FOUND:${nama_room}`);
    }
    return room.id_room;
  }

  throw new Error('ROOM_REQUIRED');
}

async function getPricePerHourForRoom(roomId) {
  const priceRow = await prisma.price_list.findFirst({
    where: { id_room: roomId },
  });
  if (!priceRow) {
    return defaultPrice;
  }
  return Number(priceRow.harga_per_jam);
}

// ==========================================
// 4. CREATE RESERVATION
// ==========================================
export async function createReservation(req, res) {
  try {
    const {
      customer_id,
      customer_name,
      room_id,
      nama_room,
      date,
      time,
      duration,
      payment_method,
    } = req.body;

    if (!date || !time) {
      return res
        .status(400)
        .json({ message: 'date dan time wajib diisi (YYYY-MM-DD & HH:mm)' });
    }
    const durasiJam = Number(duration) || 1;
    const cid = await resolveCustomerId({ customer_id, customer_name });
    let rid;
    try {
      rid = await resolveRoomId({ room_id, nama_room });
    } catch (error) {
      if (error.message.startsWith('ROOM_NOT_FOUND:')) {
        const roomName = error.message.split(':')[1];
        return res
          .status(400)
          .json({ message: `Ruangan dengan nama "${roomName}" tidak ditemukan` });
      }
      if (error.message === 'ROOM_REQUIRED') {
        return res
          .status(400)
          .json({ message: 'room_id atau nama_room wajib diisi dan valid' });
      }
      throw error;
    }
    let startMoment;
    try {
      startMoment = moment(`${date} ${time}`);
    } catch (error) {
      console.log('error', error)
      return res
        .status(400)
        .json({ message: 'Format date/time tidak valid (YYYY-MM-DD & HH:mm)' });
    }
    // console.log('startMoment', moment(startMoment, "YYYY-MM-DD", true).format("YYYY-MM-DD"))
    const endMoment = startMoment.clone().add(durasiJam, 'hours');
    const start = startMoment.format("YYYY-MM-DD HH:mm:ss");
    const end = endMoment.format("YYYY-MM-DD HH:mm:ss");
    // console.log('start', moment(date, "YYYY-MM-DD", true).format("YYYY-MM-DD"))
    const pricePerHour = await getPricePerHourForRoom(rid);
    const record = await prisma.reservation.create({
      data: {
        customer_id: cid,
        id_room: rid,
        waktu_mulai: start,
        waktu_selesai: end,
        durasi: durasiJam,
        tanggal_reservasi : date,
        total_harga: durasiJam * pricePerHour,
      },
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
        payment: true,
      },
    });
    res.status(201).json(shapeReservation(record));
  } catch (error) {
    console.error('Failed to create reservation', error);
    if (error.message?.startsWith?.('ROOM_')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create reservation' });
  }
}

// ==========================================
// 5. UPDATE RESERVATION
// ==========================================
export async function updateReservation(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation id' });
    }
    const {
      customer_id,
      customer_name,
      room_id,
      nama_room,
      date,
      time,
      duration,
      payment_method,
      payment_status,
    } = req.body;
    if (!date || !time) {
      return res
        .status(400)
        .json({ message: 'date dan time wajib diisi (YYYY-MM-DD & HH:mm)' });
    }
    const durasiJam = Number(duration) || 1;
    const cid = await resolveCustomerId({ customer_id, customer_name });
    let rid;
    try {
      rid = await resolveRoomId({ room_id, nama_room });
    } catch (error) {
      if (error.message.startsWith('ROOM_NOT_FOUND:')) {
        const roomName = error.message.split(':')[1];
        return res
          .status(400)
          .json({ message: `Ruangan dengan nama "${roomName}" tidak ditemukan` });
      }
      if (error.message === 'ROOM_REQUIRED') {
        return res
          .status(400)
          .json({ message: 'room_id atau nama_room wajib diisi dan valid' });
      }
      throw error;
    }
    let startMoment;
    try {
      startMoment = buildDateTime(date, time);
    } catch {
      return res
        .status(400)
        .json({ message: 'Format date/time tidak valid (YYYY-MM-DD & HH:mm)' });
    }
    const endMoment = startMoment.clone().add(durasiJam, 'hours');
    const start = toUTCDatePreservingLocalInput(startMoment);
    const end = toUTCDatePreservingLocalInput(endMoment);
    const pricePerHour = await getPricePerHourForRoom(rid);
    
    const record = await prisma.reservation.update({
      where: { id_reservation: id },
      data: {
        customer_id: cid,
        id_room: rid,
        waktu_mulai: start,
        waktu_selesai: end,
        durasi: durasiJam,
        total_harga: durasiJam * pricePerHour,
        // payment_status & payment_method di model user sepertinya tidak dipakai langsung 
        // karena status diambil dari relasi tabel Payment.
        // Tapi jika ada kolom legacy, bisa dibiarkan.
      },
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
        payment: true,
      },
    });
    res.json(shapeReservation(record));
  } catch (error) {
    console.error('Failed to update reservation', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(500).json({ message: 'Failed to update reservation' });
  }
}

// ==========================================
// 6. DELETE RESERVATION
// ==========================================
export async function deleteReservation(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation id' });
    }
    await prisma.reservation.delete({
      where: { id_reservation: id },
    });
    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    console.error('Failed to delete reservation', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(500).json({ message: 'Failed to delete reservation' });
  }
}

// ==========================================
// 7. PAY RESERVATION (Create Payment Record)
// ==========================================
export const payReservation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const reservation = await prisma.reservation.findFirst({
      where: { id_reservation: id }
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.payment_id) {
      return res.status(400).json({ message: 'Reservasi ini sudah lunas!' });
    }

    // 1. Buat record di tabel Payment
    const paymentRecord = await prisma.payment.create({
      data: {
        total_bayar: reservation.total_harga,
        tanggal_bayar: moment().format("YYYY-MM-DD"), 
        payment_method: "CASH", // Default Cash, bisa diambil dari req.body jika mau dinamis
      }
    });

    // 2. Update Reservation untuk link ke Payment ID
    const updatedReservation = await prisma.reservation.update({
      where: {
        id_reservation: id,
      },
      data: {
        payment_id: paymentRecord.id_payment,
      }
    });

    return res.status(201).json({
      message: 'Payment Dibayar Lunas',
      data: {
        payment: paymentRecord,
        reservation: updatedReservation
      }
    });

  } catch (error) {
    console.log('error', error);
    return res.status(500).json({ message: 'Failed to process payment' });
  }
};