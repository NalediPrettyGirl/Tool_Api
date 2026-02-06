const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const session = require('express-session');
const cookieParser = require('cookie-parser');


// You need to put your serviceAccountKey.json in the same folder as api.js
//const serviceAccount = require("./serviceAccountKey.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse JSON bodies (increased limit for base64 images)
app.use(express.json({ limit: '50mb' }));

// Serve static files from the 'web' directory
//app.use(express.static(path.join(__dirname, 'web')));

// Import Routers
const shopAuthRoutes = require('./pages/shopAuth');
const addBusinessRoutes = require('./pages/addBusiness');
const businessDashboardRoutes = require('./pages/businessDashboard');
const productDetailsRoutes = require('./pages/productDetails');

// Mount API Routes
app.use('/api', shopAuthRoutes);
app.use('/api', addBusinessRoutes);
app.use('/api/dashboard', businessDashboardRoutes);
app.use('/api/public', productDetailsRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});




