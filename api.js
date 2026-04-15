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
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(session({
    name: 'asera_session',
    secret: 'your-secret-key', // Change this in production
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
app.use('/api/admin', require('./pages/admin'));

// 5. Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '..')));

// 6. Health Check
app.get('/health-check', (req, res) => {
  res.json({ status: 'Online', message: 'API is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
