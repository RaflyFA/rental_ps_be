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
      return res
        .status(400)
        .json({ message: "reservation_id harus angka" });
    }

    const data = items.map((item) => ({
      reservation_id: reservationIdNum,
      food_id: Number(item.food_id),
      jumlah: Number(item.jumlah ?? 1),
    }));

    const result = await prisma.order_food.createMany({
      data,
    });

    res.status(201).json({
      message: "Order food berhasil dibuat",
      count: result.count,
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
