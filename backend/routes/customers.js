const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../db/connection');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await allQuery("SELECT * FROM customers ORDER BY name ASC");
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await getQuery("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const { name, siteAddress, contactNumber, email } = req.body;
  if (!name || !siteAddress) {
    return res.status(400).json({ error: "name and siteAddress are required" });
  }

  try {
    const result = await runQuery(
      "INSERT INTO customers (name, site_address, contact_number, email) VALUES (?, ?, ?, ?)",
      [name, siteAddress, contactNumber, email]
    );
    res.status(201).json({ id: result.lastID, name, siteAddress, contactNumber, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  const { name, siteAddress, contactNumber, email } = req.body;
  if (!name || !siteAddress) {
    return res.status(400).json({ error: "name and siteAddress are required" });
  }

  try {
    const result = await runQuery(
      "UPDATE customers SET name = ?, site_address = ?, contact_number = ?, email = ? WHERE id = ?",
      [name, siteAddress, contactNumber, email, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ error: "Customer not found" });
    res.json({ id: parseInt(req.params.id), name, siteAddress, contactNumber, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM customers WHERE id = ?", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: "Customer not found" });
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
