const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', require('./pages/shopAuth'));
app.use('/api', require('./pages/addBusiness'));
app.use('/api/dashboard', require('./pages/businessDashboard'));
app.use('/api/public', require('./pages/productDetails'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
