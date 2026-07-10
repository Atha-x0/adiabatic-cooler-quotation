const { db, runQuery, getQuery } = require('./db/connection');

async function migrate() {
  try {
    const admin = await getQuery("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = admin ? admin.id : 1;

    // Check if column exists
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(quotations)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasUserId = tableInfo.some(col => col.name === 'user_id');
    if (!hasUserId) {
      console.log("Adding user_id to quotations...");
      await runQuery(`ALTER TABLE quotations ADD COLUMN user_id INTEGER DEFAULT ${adminId}`);
      console.log("Migration complete.");
    } else {
      console.log("user_id already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
