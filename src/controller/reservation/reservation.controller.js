import prisma from '../../config/prisma.js';

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
      },
    });
    if (!record) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json({
      id_reservation: record.id_reservation,
      customer_name: record.customer?.nama ?? null,
      nama_room: record.room?.nama_room ?? null,
      waktu_mulai: record.waktu_mulai,
      waktu_selesai: record.waktu_selesai,
      durasi: record.durasi,
      total_harga: record.total_harga,
      payment_status: record.payment_status ?? null,
      payment_method: record.payment_method ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch reservation detail', error);
    res.status(500).json({ message: 'Failed to fetch reservation detail' });
  }
}
export async function listReservations(req, res) {
  try {
    const records = await prisma.reservation.findMany({
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
      },
      orderBy: { waktu_mulai: 'asc' },
    });

    const data = records.map((r) => ({
      id_reservation: r.id_reservation,
      customer_name: r.customer?.nama ?? null,
      nama_room: r.room?.nama_room ?? null,
      waktu_mulai: r.waktu_mulai,
      waktu_selesai: r.waktu_selesai,
      durasi: r.durasi,
      total_harga: r.total_harga,
      payment_status: r.payment_status,
      payment_method: r.payment_method,
    }));

    res.json(data);
  } catch (error) {
    console.error('Failed to list reservations', error);
    res.status(500).json({ message: 'Failed to list reservations' });
  }
}
export async function createReservation(req, res) {
  try {
    const {
      customer_name,
      nama_room,
      date,    // "YYYY-MM-DD"
      time,    // "HH:mm"
      duration,
      payment_method,
    } = req.body;

    const durasiJam = Number(duration) || 1;

    // Bangun Date dari date + time
    const start = new Date(`${date}T${time}:00.000Z`);
    const end = new Date(start.getTime() + durasiJam * 60 * 60 * 1000);

    const pricePerHour = 7000; // kalau bisa taruh di config

    // TODO: kalau di schema kamu pakai id_customer & id_room,
    // di sini harus mapping dari customer_name & nama_room ke id-nya
    const record = await prisma.reservation.create({
      data: {
        // id_customer: ...
        // id_room: ...
        waktu_mulai: start,
        waktu_selesai: end,
        durasi: durasiJam,
        total_harga: durasiJam * pricePerHour,
        payment_status: 'UNPAID',
        payment_method: payment_method || 'Cash',
      },
      include: {
        customer: { select: { nama: true } },
        room: { select: { nama_room: true } },
      },
    });

    res.status(201).json({
      id_reservation: record.id_reservation,
      customer_name: record.customer?.nama ?? customer_name ?? null,
      nama_room: record.room?.nama_room ?? nama_room ?? null,
      waktu_mulai: record.waktu_mulai,
      waktu_selesai: record.waktu_selesai,
      durasi: record.durasi,
      total_harga: record.total_harga,
      payment_status: record.payment_status,
      payment_method: record.payment_method,
    });
  } catch (error) {
    console.error('Failed to create reservation', error);
    res.status(500).json({ message: 'Failed to create reservation' });
  }
}