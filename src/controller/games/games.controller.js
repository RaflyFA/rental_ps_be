import prisma from '../../config/prisma.js';

// Helper convert number
function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// ===============================
// GET ALL GAMES
// ===============================
export async function getGames(req, res) {
  try {
    const games = await prisma.game_list.findMany({
      orderBy: { id_game: 'asc' },
      include: {
        unit: true, // jika ingin ikut menampilkan nama unit / data unit
      },
    });
    res.json(games);
  } catch (error) {
    console.error('Failed to fetch games', error);
    res.status(500).json({ message: 'Failed to fetch games' });
  }
}

// ===============================
// GET GAME BY ID
// ===============================
export async function getGameById(req, res) {
  try {
    const id = Number(req.params.id);

    const game = await prisma.game_list.findUnique({
      where: { id_game: id },
      include: { unit: true },
    });

    if (!game) return res.status(404).json({ message: 'Game not found' });

    res.json(game);
  } catch (error) {
    console.error('Failed to fetch game detail', error);
    res.status(500).json({ message: 'Failed to fetch game detail' });
  }
}

// ===============================
// CREATE GAME
// ===============================
export async function createGame(req, res) {
  try {
    const { nama_game, id_unit } = req.body;

    if (!nama_game)
      return res.status(400).json({ message: 'nama_game is required' });
    if (!id_unit)
      return res.status(400).json({ message: 'id_unit is required' });

    const newGame = await prisma.game_list.create({
      data: {
        nama_game,
        id_unit: Number(id_unit),
      },
    });

    res.status(201).json(newGame);
  } catch (error) {
    console.error('Failed to create game', error);
    res.status(500).json({ message: 'Failed to create game' });
  }
}

// ===============================
// UPDATE GAME
// ===============================
export async function updateGame(req, res) {
  try {
    const id = Number(req.params.id);
    const { nama_game, id_unit } = req.body;

    const updated = await prisma.game_list.update({
      where: { id_game: id },
      data: {
        ...(nama_game !== undefined && { nama_game }),
        ...(id_unit !== undefined && { id_unit: Number(id_unit) }),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Game not found' });
    }
    console.error('Failed to update game', error);
    res.status(500).json({ message: 'Failed to update game' });
  }
}

// ===============================
// DELETE GAME
// ===============================
export async function deleteGame(req, res) {
  try {
    const id = Number(req.params.id);

    await prisma.game_list.delete({
      where: { id_game: id },
    });

    res.json({ message: 'Game deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Game not found' });
    }
    console.error('Failed to delete game', error);
    res.status(500).json({ message: 'Failed to delete game' });
  }
}
