const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/connection');
const { isAdmin } = require('./auth');

// GET all rate cards
router.get('/', async (req, res) => {
  try {
    const cards = await allQuery("SELECT * FROM rate_cards ORDER BY created_at DESC");
    // Parse json columns
    cards.forEach(c => {
      c.plumbingCostBands = JSON.parse(c.plumbing_cost_bands_json);
      // Map to camelCase properties for React API compatibility
      c.coolingPadUnitCost = c.cooling_pad_unit_cost;
      c.aluminiumCostPerBar = c.aluminium_cost_per_bar;
      c.plateCostPerSheet = c.plate_cost_per_sheet;
      c.supportPattiCostPerBar = c.support_patti_cost_per_bar;
      c.wastageFactor = c.wastage_factor;
      c.lphMultiplier = c.lph_multiplier;
      c.versionLabel = c.version_label;
      c.effectiveDate = c.effective_date;
      c.isActive = c.is_active === 1;
    });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active rate card
router.get('/active', async (req, res) => {
  try {
    const card = await getQuery("SELECT * FROM rate_cards WHERE is_active = 1 LIMIT 1");
    if (!card) return res.status(404).json({ error: "No active rate card found" });
    
    card.plumbingCostBands = JSON.parse(card.plumbing_cost_bands_json);
    card.coolingPadUnitCost = card.cooling_pad_unit_cost;
    card.aluminiumCostPerBar = card.aluminium_cost_per_bar;
    card.plateCostPerSheet = card.plate_cost_per_sheet;
    card.supportPattiCostPerBar = card.support_patti_cost_per_bar;
    card.wastageFactor = card.wastage_factor;
    card.lphMultiplier = card.lph_multiplier;
    card.versionLabel = card.version_label;
    card.effectiveDate = card.effective_date;
    card.isActive = true;

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single rate card
router.get('/:id', async (req, res) => {
  try {
    const card = await getQuery("SELECT * FROM rate_cards WHERE id = ?", [req.params.id]);
    if (!card) return res.status(404).json({ error: "Rate card not found" });
    
    card.plumbingCostBands = JSON.parse(card.plumbing_cost_bands_json);
    card.coolingPadUnitCost = card.cooling_pad_unit_cost;
    card.aluminiumCostPerBar = card.aluminium_cost_per_bar;
    card.plateCostPerSheet = card.plate_cost_per_sheet;
    card.supportPattiCostPerBar = card.support_patti_cost_per_bar;
    card.wastageFactor = card.wastage_factor;
    card.lphMultiplier = card.lph_multiplier;
    card.versionLabel = card.version_label;
    card.effectiveDate = card.effective_date;
    card.isActive = card.is_active === 1;

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create rate card (Creates a new version - doesn't edit in place)
router.post('/', isAdmin, async (req, res) => {
  const {
    versionLabel, effectiveDate, isActive, coolingPadUnitCost,
    aluminiumCostPerBar, plateCostPerSheet, supportPattiCostPerBar,
    plumbingCostBands, wastageFactor, lphMultiplier
  } = req.body;

  if (!versionLabel || !effectiveDate || coolingPadUnitCost === undefined ||
      aluminiumCostPerBar === undefined || plateCostPerSheet === undefined ||
      supportPattiCostPerBar === undefined || !plumbingCostBands) {
    return res.status(400).json({ error: "Missing required rate card fields" });
  }

  const activeVal = isActive ? 1 : 0;
  const bandsJson = JSON.stringify(plumbingCostBands);

  try {
    if (activeVal === 1) {
      // Set all other rate cards to inactive
      await runQuery("UPDATE rate_cards SET is_active = 0");
    }

    const result = await runQuery(`
      INSERT INTO rate_cards (
        version_label, effective_date, is_active, cooling_pad_unit_cost,
        aluminium_cost_per_bar, plate_cost_per_sheet, support_patti_cost_per_bar,
        plumbing_cost_bands_json, wastage_factor, lph_multiplier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      versionLabel, effectiveDate, activeVal, coolingPadUnitCost,
      aluminiumCostPerBar, plateCostPerSheet, supportPattiCostPerBar,
      bandsJson, wastageFactor || 0.07, lphMultiplier || 4.0
    ]);

    res.status(201).json({
      id: result.lastID,
      versionLabel,
      effectiveDate,
      isActive: activeVal === 1,
      coolingPadUnitCost,
      aluminiumCostPerBar,
      plateCostPerSheet,
      supportPattiCostPerBar,
      plumbingCostBands,
      wastageFactor,
      lphMultiplier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST activate a specific rate card
router.post('/:id/activate', isAdmin, async (req, res) => {
  try {
    const card = await getQuery("SELECT id FROM rate_cards WHERE id = ?", [req.params.id]);
    if (!card) return res.status(404).json({ error: "Rate card not found" });

    await runQuery("UPDATE rate_cards SET is_active = 0");
    await runQuery("UPDATE rate_cards SET is_active = 1 WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: `Rate card version ${req.params.id} activated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
