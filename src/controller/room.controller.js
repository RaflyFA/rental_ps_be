import prisma from '../config/prisma.js';

export async function getRooms(req, res) {
	try {
		const records = await prisma.room.findMany({ orderBy: { id_room: 'asc' } });
		
		return res.status(200).json(records);
	} catch (error) {
		console.error('Failed to fetch rooms list', error);
		return res.status(500).json({ message: 'Failed to fetch rooms list' });
	}
}

export async function getRoomById(req, res) {
	try {
		const id = Number(req.params.id);
		const record = await prisma.room.findUnique({ where: { id_room: id } });
		if (!record) return res.status(404).json({ message: 'Room not found' });
		return res.json(record);
	} catch (error) {
		console.error('Failed to fetch room detail', error);
		return res.status(500).json({ message: 'Failed to fetch room detail' });
	}
}

export async function createRoom(req, res) {
  try {
    const { nama_room, tipe_room, kapasitas, harga } = req.body;

    if (!nama_room) return res.status(400).json({ message: 'nama_room is required' });
    if (!tipe_room) return res.status(400).json({ message: 'tipe_room is required' });

    const newRoom = await prisma.room.create({
      data: {
        nama_room,
        tipe_room,
        kapasitas: toNullableNumber(kapasitas),
        price_list: {
          create: {
            harga_per_jam: Number(harga),
          },
        },
      },
      include: { price_list: true }, // <-- pastikan include price_list
    });

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Failed to create room', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
}

export async function updateRoom(req, res) {
  const id = Number(req.params.id);
  const { nama_room, tipe_room, kapasitas, harga } = req.body;

  try {
    // Cek apakah room-nya ada
    const existingRoom = await prisma.room.findUnique({
      where: { id_room: id },
      include: { price_list: true },
    });

    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Update / create price_list
    const existingPrice = existingRoom.price_list[0];
    if (existingPrice) {
      await prisma.price_list.update({
        where: { id_price_list: existingPrice.id_price_list },
        data: { harga_per_jam: Number(harga) },
      });
    } else {
      await prisma.price_list.create({
        data: {
          id_room: id,
          harga_per_jam: Number(harga),
        },
      });
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id_room: id },
      data: {
        nama_room,
        tipe_room,
        kapasitas: Number(kapasitas),
      },
      include: { price_list: true },
    });

    res.json({
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Failed to update room with price", error);
    res.status(500).json({ message: "Failed to update room with price" });
  }
}

export async function deleteRoom(req, res) {
  try {
    const id = parseInt(req.params.id);

    // Hapus price_list
    await prisma.price_list.deleteMany({
      where: { id_room: id }
    });

    // Hapus reservation
    await prisma.reservation.deleteMany({
      where: { id_room: id }
    });

    // Hapus game_list (child dari unit)
    await prisma.game_list.deleteMany({
      where: { unit: { id_room: id } }
    });

    // Hapus unit
    await prisma.unit.deleteMany({
      where: { id_room: id }
    });

    // Terakhir hapus room
    await prisma.room.delete({
      where: { id_room: id }
    });

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

function toNullableNumber(value) {
	if (value === undefined || value === null || value === '') return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

export const getRoomsWithPrice = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      select: {
        id_room: true,
        nama_room: true,
        tipe_room: true,
        kapasitas: true,
        price_list: {
          select: {
            harga_per_jam: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Data room berhasil diambil",
      data: rooms,
    });
  } catch (error) {
    console.error("Failed to get rooms with price", error);
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};
