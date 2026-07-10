const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/connection');
const { isAdmin } = require('./auth');

// GET all config items
router.get('/', async (req, res) => {
  try {
    const configs = await allQuery("SELECT * FROM config");
    // Format as a simple key-value object or list
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    res.json(configMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single config key value
router.get('/:key', async (req, res) => {
  try {
    const config = await getQuery("SELECT * FROM config WHERE key = ?", [req.params.key]);
    if (!config) return res.status(404).json({ error: `Config key '${req.params.key}' not found` });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST/PUT upsert config key value
router.put('/:key', isAdmin, async (req, res) => {
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).json({ error: "value is required" });
  }

  try {
    await runQuery(
      "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [req.params.key, value.toString()]
    );
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
