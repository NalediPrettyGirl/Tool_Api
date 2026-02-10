const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors')

// Load service account key from environment variable or local file
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    serviceAccount = require("./serviceAccountKey.json");
  }
} catch (error) {
  console.error("Error loading service account key:", error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Export db so route files can use it
module.exports = { db };

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

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
