const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// 1. Initialize DB
require('./database');

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// 3. Request Logger (Helpful for debugging hosted apps)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 4. Mount API Routes
// We mount them exactly as needed by the frontend
app.use('/api', require('./pages/shopAuth'));
app.use('/api', require('./pages/addBusiness'));
app.use('/api/dashboard', require('./pages/businessDashboard'));
app.use('/api/public', require('./pages/productDetails'));

// 5. Health Check
app.get('/health-check', (req, res) => {
  res.json({ status: 'Online', message: 'API is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
