const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { allQuery, getQuery, runQuery } = require('../db/connection');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await allQuery("SELECT id, name, email, role, created_at FROM users");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await getQuery("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, and role are required" });
  }
  if (!['admin', 'engineer'].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'engineer'" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await runQuery(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );
    res.status(201).json({ id: result.lastID, name, email, role });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "name, email, and role are required" });
  }

  try {
    let query, params;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = "UPDATE users SET name = ?, email = ?, password_hash = ?, role = ? WHERE id = ?";
      params = [name, email, hash, role, req.params.id];
    } else {
      query = "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?";
      params = [name, email, role, req.params.id];
    }

    const result = await runQuery(query, params);
    if (result.changes === 0) return res.status(404).json({ error: "User not found" });

    res.json({ id: parseInt(req.params.id), name, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM users WHERE id = ?", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
