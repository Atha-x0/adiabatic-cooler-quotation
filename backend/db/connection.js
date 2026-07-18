const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  // Enable foreign keys
  await runQuery("PRAGMA foreign_keys = ON;");

  // Create Users table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'engineer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Customers table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      site_address TEXT NOT NULL,
      contact_number TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Rate Cards table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS rate_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_label TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 0 CHECK(is_active IN (0, 1)),
      cooling_pad_unit_cost REAL NOT NULL,
      aluminium_cost_per_bar REAL NOT NULL,
      plate_cost_per_sheet REAL NOT NULL,
      support_patti_cost_per_bar REAL NOT NULL,
      plumbing_cost_bands_json TEXT NOT NULL,
      wastage_factor REAL DEFAULT 0.07,
      lph_multiplier REAL DEFAULT 4.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Pump Models table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS pump_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      capacity_lph REAL NOT NULL,
      cost REAL NOT NULL,
      is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Config table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create Quotations table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      rate_card_version_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'final', 'sent')),
      input_snapshot_json TEXT NOT NULL,
      output_snapshot_json TEXT,
      pdf_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (rate_card_version_id) REFERENCES rate_cards(id) ON DELETE RESTRICT
    )
  `);

  // Seed default configurations if empty
  const configCount = await getQuery("SELECT COUNT(*) as count FROM config");
  if (configCount.count === 0) {
    await runQuery("INSERT INTO config (key, value) VALUES (?, ?)", ['padSheetWidth', '1180']);
    await runQuery("INSERT INTO config (key, value) VALUES (?, ?)", ['padSheetHeight', '2000']);
    await runQuery("INSERT INTO config (key, value) VALUES (?, ?)", ['padSheetDepth', '100']);
    await runQuery("INSERT INTO config (key, value) VALUES (?, ?)", ['aluminiumStockLength', '3048']);
    await runQuery("INSERT INTO config (key, value) VALUES (?, ?)", ['plateStockSize', '3048x1828']);
  }

  // Seed default users if empty
  const userCount = await getQuery("SELECT COUNT(*) as count FROM users");
  if (userCount.count === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const engHash = await bcrypt.hash('engineer123', 10);
    await runQuery("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", ['System Admin', 'admin@example.com', adminHash, 'admin']);
    await runQuery("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", ['Field Engineer', 'engineer@example.com', engHash, 'engineer']);
  }

  // Seed default pump models if empty
  const pumpCount = await getQuery("SELECT COUNT(*) as count FROM pump_models");
  if (pumpCount.count === 0) {
    await runQuery("INSERT INTO pump_models (model_name, capacity_lph, cost, is_active) VALUES (?, ?, ?, ?)", ['EcoFlow 1000', 1000, 200.00, 1]);
    await runQuery("INSERT INTO pump_models (model_name, capacity_lph, cost, is_active) VALUES (?, ?, ?, ?)", ['EcoFlow 3000', 3000, 400.00, 1]);
    await runQuery("INSERT INTO pump_models (model_name, capacity_lph, cost, is_active) VALUES (?, ?, ?, ?)", ['EcoFlow 6000', 6000, 700.00, 1]);
  }

  // Seed default rate card if empty
  const rateCardCount = await getQuery("SELECT COUNT(*) as count FROM rate_cards");
  if (rateCardCount.count === 0) {
    const defaultPlumbingBands = JSON.stringify([
      { minFlowLPH: 0, maxFlowLPH: 1000, cost: 100 },
      { minFlowLPH: 1000, maxFlowLPH: 4000, cost: 250 },
      { minFlowLPH: 4000, maxFlowLPH: 10000, cost: 500 }
    ]);
    await runQuery(`
      INSERT INTO rate_cards (
        version_label, effective_date, is_active, cooling_pad_unit_cost,
        aluminium_cost_per_bar, plate_cost_per_sheet, support_patti_cost_per_bar,
        plumbing_cost_bands_json, wastage_factor, lph_multiplier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Image Rates v1', '2026-07-18', 1, 3000.00,
      700.00, 2800.00, 0.00,
      defaultPlumbingBands, 0.07, 4.0
    ]);
  }
}

module.exports = {
  db,
  initDb,
  runQuery,
  getQuery,
  allQuery
};
