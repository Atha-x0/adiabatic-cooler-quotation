const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getQuery } = require('../db/connection');

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await getQuery("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token: role-email-timestamp
    const token = `${user.role}-${user.email}-${Date.now()}`;
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(' ')[1];
  if (!token.startsWith('admin-')) {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

// Middleware to authenticate user and extract from DB
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(' ')[1];
  const parts = token.split('-');
  if (parts.length < 3) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  const email = parts[1];
  try {
    const user = await getQuery("SELECT id, name, email, role FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: "Invalid token user" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Auth database error" });
  }
};

module.exports = { router, isAdmin, authenticate };
