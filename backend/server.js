const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Bind API Routers
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/rate-cards', require('./routes/rateCards'));
app.use('/api/pump-models', require('./routes/pumpModels'));
app.use('/api/configs', require('./routes/configs'));
app.use('/api/quotations', require('./routes/quotations'));

// Serve PDFs
const path = require('path');
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Base health check route
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Initialize database and start listening
initDb()
  .then(() => {
    console.log("Database initialized successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
