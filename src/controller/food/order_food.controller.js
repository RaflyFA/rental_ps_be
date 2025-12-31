import prisma from "../../config/prisma.js";

export async function createOrderFood(req, res) {
  try {
    const { reservation_id, items } = req.body;

    if (!reservation_id || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "reservation_id dan items wajib diisi" });
    }
    const reservationIdNum = Number(reservation_id);
    if (Number.isNaN(reservationIdNum)) {
      return res.status(400).json({ message: "reservation_id harus angka" });
    }
    const foodIds = items.map((i) => Number(i.food_id));
    const foodListDB = await prisma.food_list.findMany({
      where: { id_food: { in: foodIds } },
    });
    let totalHargaMakanan = 0;
    const dataToInsert = [];
    for (const item of items) {
      const foodDB = foodListDB.find((f) => f.id_food === Number(item.food_id));
      if (foodDB) {
        const qty = Number(item.jumlah ?? 1);
        const subtotal = Number(foodDB.harga) * qty;
        totalHargaMakanan += subtotal;

        dataToInsert.push({
          reservation_id: reservationIdNum,
          food_id: Number(item.food_id),
          jumlah: qty,
        });
      }
    }
    const [createdOrders, updatedReservation] = await prisma.$transaction([
      prisma.order_food.createMany({
        data: dataToInsert,
      }),
      prisma.reservation.update({
        where: { id_reservation: reservationIdNum },
        data: {
          total_harga: {
            increment: totalHargaMakanan,
          },
        },
      }),
    ]);
    res.status(201).json({
      message: "Order food berhasil, total harga reservasi diperbarui",
      added_cost: totalHargaMakanan,
      count: createdOrders.count,
    });
  } catch (error) {
    console.error("Failed to create order_food", error);
    res.status(500).json({ message: "Failed to create order_food" });
  }
}

export async function getOrderFoodByReservation(req, res) {
  try {
    const reservationId = Number(req.params.reservationId);
    if (Number.isNaN(reservationId)) {
      return res.status(400).json({ message: "reservationId harus angka" });
    }

    const rows = await prisma.order_food.findMany({
      where: { reservation_id: reservationId },
      include: {
        food_list: true,
      },
      orderBy: { id_order: "asc" },
    });

    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch order_food", error);
    res.status(500).json({ message: "Failed to fetch order_food" });
  }
}