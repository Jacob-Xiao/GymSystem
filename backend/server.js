const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase body size limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const loginRoutes = require('./routes/login');
const memberRoutes = require('./routes/member');
const employeeRoutes = require('./routes/employee');
const equipmentRoutes = require('./routes/equipment');
const classRoutes = require('./routes/class');
const userRoutes = require('./routes/user');
const equipmentBookingRoutes = require('./routes/equipmentBooking');
const notificationRoutes = require('./routes/notification');

app.use('/api/login', loginRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/class', classRoutes);
app.use('/api/user', userRoutes);
app.use('/api/equipment-booking', equipmentBookingRoutes);
app.use('/api/notification', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Body size limit: JSON=50mb, URL-encoded=50mb`);
});
