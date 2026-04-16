const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//const serviceAccount = require( './serviceAccountKey.json'); // Your downloaded key
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
app.use(cors());

// Serve static HTML files
//app.use(express.static(path.join(__dirname, '..')));

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
        secure: true, // Set to true on Render (HTTPS)
        sameSite: 'none', // Required for cross-site cookies
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// 3. Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 4. Mount API Routes
app.use('/api', require('./pages/shopAuth'));
app.use('/api', require('./pages/addBusiness'));
app.use('/api/dashboard', require('./pages/businessDashboard'));
app.use('/api/public', require('./pages/productDetails'));
app.use('/api/admin', require('./pages/admin'));

// 5. Health Check
app.get('/health-check', (req, res) => {
  res.json({ status: 'Online', message: 'API is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
