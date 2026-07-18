const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/connection');
const { calculateFullQuotation } = require('../calculations/calculationEngine');
const { generateQuotePdf } = require('../pdf-generator');
const { authenticate } = require('./auth');
const path = require('path');

async function ensurePdfGenerated(id) {
  const q = await getQuery(`
    SELECT q.*, c.name as customer_name, c.site_address, c.contact_number, c.email as customer_email, rc.version_label as rate_card_version
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    JOIN rate_cards rc ON q.rate_card_version_id = rc.id
    WHERE q.id = ?
  `, [id]);

  if (!q) return null;

  q.customerId = q.customer_id;
  q.rateCardVersionId = q.rate_card_version_id;
  q.inputSnapshot = JSON.parse(q.input_snapshot_json);
  q.outputSnapshot = q.output_snapshot_json ? JSON.parse(q.output_snapshot_json) : null;
  
  const rc = await getQuery("SELECT * FROM rate_cards WHERE id = ?", [q.rateCardVersionId]);
  if (rc) {
    rc.plumbingCostBands = JSON.parse(rc.plumbing_cost_bands_json);
    rc.coolingPadUnitCost = rc.cooling_pad_unit_cost;
    rc.aluminiumCostPerBar = rc.aluminium_cost_per_bar;
    rc.plateCostPerSheet = rc.plate_cost_per_sheet;
    rc.supportPattiCostPerBar = rc.support_patti_cost_per_bar;
    rc.wastageFactor = rc.wastage_factor;
    rc.lphMultiplier = rc.lph_multiplier;
    q.rates = rc;
  }

  const filePath = path.join(__dirname, '..', 'pdfs', `quotation-${id}.pdf`);
  await generateQuotePdf(q, null, filePath);
  
  const pdfUrl = `/pdfs/quotation-${id}.pdf`;
  await runQuery("UPDATE quotations SET pdf_url = ? WHERE id = ?", [pdfUrl, id]);
  return pdfUrl;
}

// GET all quotations
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT q.*, c.name as customer_name, rc.version_label as rate_card_version
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN rate_cards rc ON q.rate_card_version_id = rc.id
    `;
    let params = [];

    if (req.user.role === 'engineer') {
      query += ` WHERE q.user_id = ? `;
      params.push(req.user.id);
    }
    query += ` ORDER BY q.created_at DESC `;

    const quotes = await allQuery(query, params);
    
    quotes.forEach(q => {
      q.customerId = q.customer_id;
      q.rateCardVersionId = q.rate_card_version_id;
      q.inputSnapshot = JSON.parse(q.input_snapshot_json);
      q.outputSnapshot = q.output_snapshot_json ? JSON.parse(q.output_snapshot_json) : null;
      q.pdfUrl = q.pdf_url;
      
      delete q.customer_id;
      delete q.rate_card_version_id;
      delete q.input_snapshot_json;
      delete q.output_snapshot_json;
      delete q.pdf_url;
    });

    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single quotation
router.get('/:id', async (req, res) => {
  try {
    const q = await getQuery(`
      SELECT q.*, c.name as customer_name, c.site_address, c.contact_number, c.email as customer_email, rc.version_label as rate_card_version
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN rate_cards rc ON q.rate_card_version_id = rc.id
      WHERE q.id = ?
    `, [req.params.id]);

    if (!q) return res.status(404).json({ error: "Quotation not found" });

    q.customerId = q.customer_id;
    q.rateCardVersionId = q.rate_card_version_id;
    q.inputSnapshot = JSON.parse(q.input_snapshot_json);
    q.outputSnapshot = q.output_snapshot_json ? JSON.parse(q.output_snapshot_json) : null;
    q.pdfUrl = q.pdf_url;
    
    delete q.customer_id;
    delete q.rate_card_version_id;
    delete q.input_snapshot_json;
    delete q.output_snapshot_json;
    delete q.pdf_url;

    // Fetch the rate card specifications snapshot used for this quote
    const rc = await getQuery("SELECT * FROM rate_cards WHERE id = ?", [q.rateCardVersionId]);
    if (rc) {
      rc.plumbingCostBands = JSON.parse(rc.plumbing_cost_bands_json);
      rc.coolingPadUnitCost = rc.cooling_pad_unit_cost;
      rc.aluminiumCostPerBar = rc.aluminium_cost_per_bar;
      rc.plateCostPerSheet = rc.plate_cost_per_sheet;
      rc.supportPattiCostPerBar = rc.support_patti_cost_per_bar;
      rc.wastageFactor = rc.wastage_factor;
      rc.lphMultiplier = rc.lph_multiplier;
      q.rates = rc;
    }

    res.json(q);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to run calculations with active settings & pumps
async function performCalculation(inputSnapshot) {
  // 1. Fetch active rate card
  const rateCard = await getQuery("SELECT * FROM rate_cards WHERE is_active = 1 LIMIT 1");
  if (!rateCard) throw new Error("No active rate card configured");
  
  rateCard.plumbingCostBands = JSON.parse(rateCard.plumbing_cost_bands_json);
  rateCard.coolingPadUnitCost = rateCard.cooling_pad_unit_cost;
  rateCard.aluminiumCostPerBar = rateCard.aluminium_cost_per_bar;
  rateCard.plateCostPerSheet = rateCard.plate_cost_per_sheet;
  rateCard.supportPattiCostPerBar = rateCard.support_patti_cost_per_bar;
  rateCard.wastageFactor = rateCard.wastage_factor;
  rateCard.lphMultiplier = rateCard.lph_multiplier;

  // 2. Fetch all configs
  const configList = await allQuery("SELECT * FROM config");
  const config = {};
  configList.forEach(c => {
    if ([
      'padSheetWidth', 'padSheetHeight', 'padSheetDepth', 'padReqQty',
      'bottomPlateWidth', 'bottomPlateHeight', 'bottomPlateDepth', 'bottomPlateReqQty',
      'sidePlateWidth', 'sidePlateHeight', 'sidePlateDepth', 'sidePlateReqQty',
      'supportPattiWidth', 'supportPattiHeight', 'supportPattiDepth', 'supportPattiReqQty',
      'aluminiumStockLength'
    ].includes(c.key)) {
      config[c.key] = parseFloat(c.value);
    } else {
      config[c.key] = c.value;
    }
  });

  // 3. Fetch active pump models
  const pumps = await allQuery("SELECT * FROM pump_models WHERE is_active = 1");
  const pumpModelList = pumps.map(p => ({
    id: p.id,
    modelName: p.model_name,
    capacityLPH: p.capacity_lph,
    cost: p.cost,
    isActive: p.is_active === 1
  }));

  // 4. Run calculations
  const outputSnapshot = calculateFullQuotation(inputSnapshot, rateCard, config, pumpModelList);
  return { rateCardId: rateCard.id, outputSnapshot };
}

// POST calculate estimate (runs real calculations without saving)
router.post('/calculate', async (req, res) => {
  const { inputSnapshot } = req.body;
  if (!inputSnapshot) {
    return res.status(400).json({ error: "inputSnapshot is required" });
  }

  try {
    const { rateCardId, outputSnapshot } = await performCalculation(inputSnapshot);
    res.json({
      rateCardVersionId: rateCardId,
      inputSnapshot,
      outputSnapshot
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create quotation (runs real calculations)
router.post('/', authenticate, async (req, res) => {
  const { customerId, inputSnapshot, status } = req.body;
  if (!customerId || !inputSnapshot || !status) {
    return res.status(400).json({ error: "customerId, inputSnapshot, and status are required" });
  }

  try {
    // Verify customer exists
    const customer = await getQuery("SELECT id FROM customers WHERE id = ?", [customerId]);
    if (!customer) return res.status(400).json({ error: "Customer not found" });

    // Run calculations
    const { rateCardId, outputSnapshot } = await performCalculation(inputSnapshot);

    const result = await runQuery(`
      INSERT INTO quotations (
        customer_id, user_id, rate_card_version_id, status, input_snapshot_json, output_snapshot_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      customerId,
      req.user.id,
      rateCardId,
      status,
      JSON.stringify(inputSnapshot),
      JSON.stringify(outputSnapshot)
    ]);

    let finalPdfUrl = null;
    if (status === 'final') {
      finalPdfUrl = await ensurePdfGenerated(result.lastID);
    }

    res.status(201).json({
      id: result.lastID,
      customerId,
      rateCardVersionId: rateCardId,
      status,
      inputSnapshot,
      outputSnapshot,
      pdfUrl: finalPdfUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update quotation status or snapshot (re-runs calculations if inputs change)
router.put('/:id', async (req, res) => {
  const { status, inputSnapshot, pdfUrl } = req.body;

  try {
    const q = await getQuery("SELECT * FROM quotations WHERE id = ?", [req.params.id]);
    if (!q) return res.status(404).json({ error: "Quotation not found" });

    let finalStatus = status || q.status;
    let finalInputJson = inputSnapshot ? JSON.stringify(inputSnapshot) : q.input_snapshot_json;
    let finalOutputJson = q.output_snapshot_json;
    let finalPdfUrl = pdfUrl || q.pdf_url;

    if (inputSnapshot) {
      const { outputSnapshot } = await performCalculation(inputSnapshot);
      finalOutputJson = JSON.stringify(outputSnapshot);
    }

    await runQuery(`
      UPDATE quotations
      SET status = ?, input_snapshot_json = ?, output_snapshot_json = ?, pdf_url = ?
      WHERE id = ?
    `, [finalStatus, finalInputJson, finalOutputJson, finalPdfUrl, req.params.id]);

    if (finalStatus === 'final' && !finalPdfUrl) {
      finalPdfUrl = await ensurePdfGenerated(req.params.id);
    }

    res.json({
      id: parseInt(req.params.id),
      status: finalStatus,
      inputSnapshot: inputSnapshot || JSON.parse(q.input_snapshot_json),
      outputSnapshot: finalOutputJson ? JSON.parse(finalOutputJson) : null,
      pdfUrl: finalPdfUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PDF quotation
router.get('/:id/pdf', async (req, res) => {
  try {
    const q = await getQuery(`
      SELECT q.*, c.name as customer_name, c.site_address, c.contact_number, c.email as customer_email, rc.version_label as rate_card_version
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN rate_cards rc ON q.rate_card_version_id = rc.id
      WHERE q.id = ?
    `, [req.params.id]);

    if (!q) return res.status(404).json({ error: "Quotation not found" });

    q.customerId = q.customer_id;
    q.rateCardVersionId = q.rate_card_version_id;
    q.inputSnapshot = JSON.parse(q.input_snapshot_json);
    q.outputSnapshot = q.output_snapshot_json ? JSON.parse(q.output_snapshot_json) : null;
    
    delete q.customer_id;
    delete q.rate_card_version_id;
    delete q.input_snapshot_json;
    delete q.output_snapshot_json;

    const rc = await getQuery("SELECT * FROM rate_cards WHERE id = ?", [q.rateCardVersionId]);
    if (rc) {
      rc.plumbingCostBands = JSON.parse(rc.plumbing_cost_bands_json);
      rc.coolingPadUnitCost = rc.cooling_pad_unit_cost;
      rc.aluminiumCostPerBar = rc.aluminium_cost_per_bar;
      rc.plateCostPerSheet = rc.plate_cost_per_sheet;
      rc.supportPattiCostPerBar = rc.support_patti_cost_per_bar;
      rc.wastageFactor = rc.wastage_factor;
      rc.lphMultiplier = rc.lph_multiplier;
      q.rates = rc;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${q.id}.pdf`);

    // Stream directly back for download (does not write to disk here)
    await generateQuotePdf(q, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE quotation
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM quotations WHERE id = ?", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: "Quotation not found" });
    res.json({ success: true, message: "Quotation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
