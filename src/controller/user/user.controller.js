import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";

function shapeUser(row) {
  if (!row) return null;
  return {
    id: row.id_user,
    name: row.username,
    email: row.email,
    role: row.role,
  };
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const search = (req.query.search || "").trim();
    const skip = (page - 1) * limit;
    const where = search
      ? { username: { contains: search, mode: "insensitive" } }
      : {};

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { id_user: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      data: rows.map(shapeUser),
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Failed to list users", error);
    res.status(500).json({ message: "Failed to list users" });
  }
}
export async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const row = await prisma.user.findUnique({
      where: { id_user: id },
    });

    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(shapeUser(row));
  } catch (error) {
    console.error("Failed to get user", error);
    res.status(500).json({ message: "Failed to get user" });
  }
}
export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "password is required" });
    }
    if (!role || !["owner", "staff"].includes(role)) {
      return res
        .status(400)
        .json({ message: 'role must be "owner" atau "staff"' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const row = await prisma.user.create({
      data: {
        username: name.trim(),
        email: email?.trim() || null,
        password_hash: passwordHash,
        role,
      },
    });

    res.status(201).json(shapeUser(row));
  } catch (error) {
    console.error("Failed to create user", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}
export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const { name, email, password, role } = req.body;
    const data = {};
    if (name !== undefined) data.username = String(name).trim();
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (role !== undefined) data.role = role;
    if (password !== undefined && password.trim()) {
      data.password_hash = await bcrypt.hash(password, 10);
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }
    if (data.role && !["owner", "staff"].includes(data.role)) {
      return res
        .status(400)
        .json({ message: 'role must be "owner" atau "staff"' });
    }
    const row = await prisma.user.update({
      where: { id_user: id },
      data,
    });
    res.json(shapeUser(row));
  } catch (error) {
    console.error("Failed to update user", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
}
export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    await prisma.user.delete({
      where: { id_user: id },
    });
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Failed to delete user", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to delete user" });
  }
}