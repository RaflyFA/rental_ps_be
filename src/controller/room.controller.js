import prisma from '../config/prisma.js';

export async function getRooms(req, res) {
	try {
		const records = await prisma.room.findMany({ orderBy: { id_room: 'asc' } });
		res.json(records);
	} catch (error) {
		console.error('Failed to fetch rooms list', error);
		res.status(500).json({ message: 'Failed to fetch rooms list' });
	}
}

export async function getRoomById(req, res) {
	try {
		const id = Number(req.params.id);
		const record = await prisma.room.findUnique({ where: { id_room: id } });
		if (!record) return res.status(404).json({ message: 'Room not found' });
		res.json(record);
	} catch (error) {
		console.error('Failed to fetch room detail', error);
		res.status(500).json({ message: 'Failed to fetch room detail' });
	}
}

export async function createRoom(req, res) {
	try {
		const { nama_room, tipe_room, kapasitas } = req.body;
		if (!nama_room) return res.status(400).json({ message: 'nama_room is required' });
		if (!tipe_room) return res.status(400).json({ message: 'tipe_room is required' });

		const newRecord = await prisma.room.create({
			data: {
				nama_room,
				tipe_room,
				kapasitas: toNullableNumber(kapasitas),
			},
		});
		res.status(201).json(newRecord);
	} catch (error) {
		console.error('Failed to create room', error);
		res.status(500).json({ message: 'Failed to create room' });
	}
}

export async function updateRoom(req, res) {
	try {
		const id = Number(req.params.id);
		const { nama_room, tipe_room, kapasitas } = req.body;
		const updated = await prisma.room.update({
			where: { id_room: id },
			data: {
				...(nama_room !== undefined && { nama_room }),
				...(tipe_room !== undefined && { tipe_room }),
				kapasitas: toNullableNumber(kapasitas),
			},
		});
		res.json(updated);
	} catch (error) {
		if (error.code === 'P2025') {
			return res.status(404).json({ message: 'Room not found' });
		}
		console.error('Failed to update room', error);
		res.status(500).json({ message: 'Failed to update room' });
	}
}

export async function deleteRoom(req, res) {
	try {
		const id = Number(req.params.id);
		await prisma.room.delete({ where: { id_room: id } });
		res.json({ message: 'Room deleted' });
	} catch (error) {
		if (error.code === 'P2025') {
			return res.status(404).json({ message: 'Room not found' });
		}
		console.error('Failed to delete room', error);
		res.status(500).json({ message: 'Failed to delete room' });
	}
}

function toNullableNumber(value) {
	if (value === undefined || value === null || value === '') return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

