const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/connection');
const { isAdmin } = require('./auth');

// GET all pump models
router.get('/', async (req, res) => {
  try {
    const pumps = await allQuery("SELECT * FROM pump_models ORDER BY cost ASC");
    pumps.forEach(p => {
      p.modelName = p.model_name;
      p.capacityLPH = p.capacity_lph;
      p.isActive = p.is_active === 1;
    });
    res.json(pumps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single pump model
router.get('/:id', async (req, res) => {
  try {
    const pump = await getQuery("SELECT * FROM pump_models WHERE id = ?", [req.params.id]);
    if (!pump) return res.status(404).json({ error: "Pump model not found" });
    
    pump.modelName = pump.model_name;
    pump.capacityLPH = pump.capacity_lph;
    pump.isActive = pump.is_active === 1;

    res.json(pump);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create pump model
router.post('/', isAdmin, async (req, res) => {
  const { modelName, capacityLPH, cost, isActive } = req.body;
  if (!modelName || capacityLPH === undefined || cost === undefined) {
    return res.status(400).json({ error: "modelName, capacityLPH, and cost are required" });
  }

  const activeVal = isActive === false ? 0 : 1;

  try {
    const result = await runQuery(
      "INSERT INTO pump_models (model_name, capacity_lph, cost, is_active) VALUES (?, ?, ?, ?)",
      [modelName, capacityLPH, cost, activeVal]
    );
    res.status(201).json({ id: result.lastID, modelName, capacityLPH, cost, isActive: activeVal === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update pump model
router.put('/:id', isAdmin, async (req, res) => {
  const { modelName, capacityLPH, cost, isActive } = req.body;
  if (!modelName || capacityLPH === undefined || cost === undefined) {
    return res.status(400).json({ error: "modelName, capacityLPH, and cost are required" });
  }

  const activeVal = isActive === false ? 0 : 1;

  try {
    const result = await runQuery(
      "UPDATE pump_models SET model_name = ?, capacity_lph = ?, cost = ?, is_active = ? WHERE id = ?",
      [modelName, capacityLPH, cost, activeVal, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ error: "Pump model not found" });
    res.json({ id: parseInt(req.params.id), modelName, capacityLPH, cost, isActive: activeVal === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE pump model
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM pump_models WHERE id = ?", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: "Pump model not found" });
    res.json({ success: true, message: "Pump model deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
