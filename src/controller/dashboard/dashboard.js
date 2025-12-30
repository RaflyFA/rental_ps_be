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
    const todayStr = getTodayString();

    // 1. Total Revenue (Sum of all paid reservations)
    // We assume valid revenue comes from reservation with payment_id (paid)
    const revenueAgg = await prisma.reservation.aggregate({
      _sum: {
        total_harga: true,
      },
      where: {
        payment_id: { not: null } // Only count paid transactions
      }
    });

    // 2. Active/Occupied Rooms (Reservations for today)
    // Since we don't have a specific "status" column, we count reservations scheduled for today
    const activeRoomsCount = await prisma.reservation.count({
      where: {
        tanggal_reservasi: todayStr
      }
    });

    // To show "X / Total Rooms", we need total room count
    const totalRoomsCount = await prisma.room.count();

    // 3. Total Members (Customers)
    const totalMembers = await prisma.customer.count();

    // 4. Pending Issues (e.g., Unpaid Reservations)
    // We count reservations that have passed (or exist) but have NO payment_id
    const pendingIssues = await prisma.reservation.count({
      where: {
        payment_id: null
      }
    });

    res.json({
      revenue: `Rp ${Number(revenueAgg._sum.total_harga || 0).toLocaleString('id-ID')}`,
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
        if (item.payment_id) status = "Finished"; // Or "Active" depending on logic
        
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