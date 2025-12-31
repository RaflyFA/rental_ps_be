import prisma from '../../config/prisma.js';

// Helper to get today's date string (Adjust format if your DB uses DD-MM-YYYY)
const getTodayString = () => {
  const d = new Date();
  // Returns "YYYY-MM-DD". Change this if your DB saves it differently.
  return d.toISOString().split('T')[0]; 
};

// ===============================
// GET DASHBOARD STATS (Cards)
// ===============================
export async function getStats(req, res) {
  try {
    // 1. Total Revenue (Sum of all paid reservations)
    // We assume valid revenue comes from reservation with payment_id (paid)
    const revenueRows = await prisma.$queryRaw`
      SELECT SUM(r.total_harga) AS total
      FROM \`reservation\` r
      JOIN \`payment\` p ON p.reservation_id = r.id_reservation
      WHERE p.total_bayar >= r.total_harga
    `;
    const totalRevenue = Number(revenueRows?.[0]?.total ?? 0);

    // 2. Active/Occupied Rooms (Reservations for today)
    // Since we don't have a specific "status" column, we count reservations scheduled for today
    const activeRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS count
      FROM \`reservation\` r
      WHERE STR_TO_DATE(REPLACE(REPLACE(r.waktu_mulai, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s') <= NOW()
        AND STR_TO_DATE(REPLACE(REPLACE(r.waktu_selesai, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s') >= NOW()
    `;
    const activeRoomsCount = Number(activeRows?.[0]?.count ?? 0);

    // To show "X / Total Rooms", we need total room count
    const totalRoomsCount = await prisma.room.count();

    // 3. Total Members (Customers)
    const totalMembers = await prisma.customer.count();

    // 4. Pending Issues (e.g., Unpaid Reservations)
    // We count reservations that have passed (or exist) but have NO payment_id
    const pendingRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS count
      FROM \`reservation\` r
      LEFT JOIN \`payment\` p ON p.reservation_id = r.id_reservation
      WHERE p.id_payment IS NULL OR p.total_bayar < r.total_harga
    `;
    const pendingIssues = Number(pendingRows?.[0]?.count ?? 0);

    res.json({
      revenue: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      activeRooms: `${activeRoomsCount} / ${totalRoomsCount}`,
      members: totalMembers.toString(),
      issues: pendingIssues.toString()
    });

  } catch (error) {
    console.error("Failed to fetch dashboard stats", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
}

// ===============================
// GET RECENT ACTIVITY (Table)
// ===============================
export async function getRecentActivity(req, res) {
  try {
    const limit = 3;

    const recent = await prisma.reservation.findMany({
      take: limit,
      orderBy: {
        id_reservation: 'desc' // Newest first
      },
      include: {
        customer: true,
        room: true,
        payment: true
      }
    });

    // Map data to match Frontend structure
    const formattedData = recent.map((item) => {
        // Determine status based on payment existence
        let status = "Booked";
        if (item.payment) status = "Finished"; // Or "Active" depending on logic
        
        return {
            id: item.id_reservation,
            user: item.customer?.nama || "Unknown",
            room: item.room?.nama_room || "-",
            time: `${item.waktu_mulai} - ${item.waktu_selesai}`,
            status: status,
            amount: `Rp ${Number(item.total_harga).toLocaleString('id-ID')}`
        };
    });

    res.json(formattedData);

  } catch (error) {
    console.error("Failed to fetch recent activity", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
}

// ===============================
// GET ACTIVE ROOMS (Modal Detail)
// ===============================
export async function getActiveRooms(req, res) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        r.id_reservation AS id,
        r.waktu_mulai AS start,
        r.waktu_selesai AS end,
        c.nama AS customer,
        rm.nama_room AS room
      FROM \`reservation\` r
      JOIN \`customer\` c ON c.id_customer = r.customer_id
      JOIN \`room\` rm ON rm.id_room = r.id_room
      WHERE STR_TO_DATE(REPLACE(REPLACE(r.waktu_mulai, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s') <= NOW()
        AND STR_TO_DATE(REPLACE(REPLACE(r.waktu_selesai, 'T', ' '), 'Z', ''), '%Y-%m-%d %H:%i:%s') >= NOW()
      ORDER BY r.waktu_mulai ASC
    `;

    res.json(
      (rows || []).map((row) => ({
        id: row.id,
        room: row.room ?? '-',
        customer: row.customer ?? 'Unknown',
        start: row.start,
        end: row.end,
      })),
    );
  } catch (error) {
    console.error("Failed to fetch active rooms", error);
    res.status(500).json({ message: "Failed to fetch active rooms" });
  }
}

// ===============================
// GET REVENUE DETAIL (Modal)
// ===============================
export async function getRevenueDetail(req, res) {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));

    const records = await prisma.reservation.findMany({
      where: {
        payment: { isNot: null },
      },
      include: {
        customer: true,
        room: true,
        payment: true,
        order_food: {
          include: { food_list: true },
        },
      },
      orderBy: { id_reservation: 'desc' },
      take: limit,
    });

    const rows = records
      .filter((item) => Number(item.payment?.total_bayar || 0) >= Number(item.total_harga || 0))
      .map((item) => {
        const foods = (item.order_food || []).map((row) => {
          const price = Number(row.food_list?.harga || 0);
          const qty = Number(row.jumlah || 0);
          return {
            name: row.food_list?.nama_makanan ?? "-",
            qty,
            price,
            subtotal: price * qty,
          };
        });
        const foodTotal = foods.reduce((sum, f) => sum + f.subtotal, 0);
        const total = Number(item.total_harga || 0);
        return {
          id: item.id_reservation,
          customer: item.customer?.nama ?? "Unknown",
          room: item.room?.nama_room ?? "-",
          date: item.tanggal_reservasi,
          amount: total,
          method: item.payment?.payment_method ?? "-",
          foodTotal,
          roomTotal: Math.max(0, total - foodTotal),
          foods,
        };
      });

    res.json({
      rows,
      shownTotal: rows.reduce((sum, row) => sum + row.amount, 0),
      totalRevenue: Number(
        (
          await prisma.$queryRaw`
            SELECT SUM(r.total_harga) AS total
            FROM \`reservation\` r
            JOIN \`payment\` p ON p.reservation_id = r.id_reservation
            WHERE p.total_bayar >= r.total_harga
          `
        )?.[0]?.total ?? 0
      ),
    });
  } catch (error) {
    console.error("Failed to fetch revenue detail", error);
    res.status(500).json({ message: "Failed to fetch revenue detail" });
  }
}

// ===============================
// GET REVENUE TREND (Chart)
// ===============================
export async function getRevenueTrend(req, res) {
  try {
    const days = Math.max(1, Math.min(30, Number(req.query.days) || 7));
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    const startStr = start.toISOString().split('T')[0];

    const rows = await prisma.$queryRaw`
      SELECT DATE(p.tanggal_bayar) AS date, SUM(p.total_bayar) AS total
      FROM \`payment\` p
      WHERE DATE(p.tanggal_bayar) >= ${startStr}
      GROUP BY DATE(p.tanggal_bayar)
      ORDER BY DATE(p.tanggal_bayar) ASC
    `;

    const map = new Map(
      rows.map((row) => {
        const rawDate = row.date;
        const key =
          typeof rawDate === 'string'
            ? rawDate
            : rawDate?.toISOString
              ? rawDate.toISOString().split('T')[0]
              : String(rawDate);
        return [key, Number(row.total || 0)];
      }),
    );
    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      series.push({ date: key, total: map.get(key) || 0 });
    }

    res.json(series);
  } catch (error) {
    console.error("Failed to fetch revenue trend", error);
    res.status(500).json({ message: "Failed to fetch revenue trend" });
  }
}
