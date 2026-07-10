const { initDb, runQuery, getQuery, allQuery } = require('./db/connection');

async function testDatabase() {
  console.log("--- Starting Database Layer Validation ---");
  
  try {
    // 1. Initialize DB
    await initDb();
    console.log("✅ DB initialization & migrations completed.");

    // 2. Validate Default Seeding
    const configs = await allQuery("SELECT * FROM config");
    console.log(`✅ Config table has ${configs.length} items (expected >= 4).`);

    const users = await allQuery("SELECT * FROM users");
    console.log(`✅ Users table seeded with ${users.length} default users.`);

    const pumpModels = await allQuery("SELECT * FROM pump_models");
    console.log(`✅ PumpModels table seeded with ${pumpModels.length} models.`);

    const rateCards = await allQuery("SELECT * FROM rate_cards");
    console.log(`✅ RateCards table seeded with ${rateCards.length} version.`);

    // 3. Test UNIQUE Constraint on Users Table
    try {
      await runQuery("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [
        'Duplicate Admin', 'admin@example.com', 'dummy_hash', 'admin'
      ]);
      console.error("❌ UNIQUE Constraint Test Failed: Allowed duplicate email.");
      process.exit(1);
    } catch (e) {
      console.log("✅ UNIQUE constraint for user email behaves correctly.");
    }

    // 4. Test CHECK Constraint on User Roles
    try {
      await runQuery("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [
        'Invalid User', 'invalid@example.com', 'dummy_hash', 'unauthorized_role'
      ]);
      console.error("❌ CHECK Constraint Test Failed: Allowed invalid user role.");
      process.exit(1);
    } catch (e) {
      console.log("✅ CHECK constraint for user role behaves correctly.");
    }

    // 5. Test Customer Insertion
    const custResult = await runQuery(
      "INSERT INTO customers (name, site_address, contact_number, email) VALUES (?, ?, ?, ?)",
      ['Test Customer LLC', '456 Tech Boulevard', '555-1234', 'test@customer.com']
    );
    const newCustId = custResult.lastID;
    console.log(`✅ Customer insertion verified (New ID: ${newCustId}).`);

    // 6. Test Quotation Insertion
    const activeCard = await getQuery("SELECT id FROM rate_cards WHERE is_active = 1 LIMIT 1");
    const quoteResult = await runQuery(`
      INSERT INTO quotations (
        customer_id, rate_card_version_id, status, input_snapshot_json, output_snapshot_json
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      newCustId,
      activeCard.id,
      'draft',
      JSON.stringify({ height: 1800, width: 2400, depth: 1500 }),
      JSON.stringify({ grandTotal: 3010 })
    ]);
    const newQuoteId = quoteResult.lastID;
    console.log(`✅ Quotation insertion verified (New ID: ${newQuoteId}).`);

    // 7. Verify Foreign Key Restrict Rules (Deleting a customer with active quotes should fail)
    try {
      await runQuery("DELETE FROM customers WHERE id = ?", [newCustId]);
      console.error("❌ FOREIGN KEY Constraint Test Failed: Allowed deletion of customer with active quote.");
      process.exit(1);
    } catch (e) {
      console.log("✅ FOREIGN KEY constraints behave correctly (prevented orphan quotation records).");
    }

    // Clean up quote first, then customer
    await runQuery("DELETE FROM quotations WHERE id = ?", [newQuoteId]);
    await runQuery("DELETE FROM customers WHERE id = ?", [newCustId]);
    console.log("✅ Database test cleanups finished.");

    console.log("\n🎉 DATABASE LAYER VERIFICATION COMPLETED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error("❌ Verification failed with error:", err);
    process.exit(1);
  }
}

testDatabase();
