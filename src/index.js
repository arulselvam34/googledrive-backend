require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

/* =========================
   ✅ CORS CONFIG (FIXED)
========================= */

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, Postman, curl
    if (!origin) return callback(null, true);

    // Allow ALL Vercel frontend deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow local development
    if (origin === 'http://localhost:3000') {
      return callback(null, true);
    }

    // Block everything else
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

/* =========================
   BODY PARSERS
========================= */

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

/* =========================
   REQUEST LOGGING
========================= */

app.use(requestLogger);

/* =========================
   DATABASE CONNECTION
========================= */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

/* =========================
   HEALTH CHECK
========================= */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* =========================
   ROUTES
========================= */

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', healthRoutes);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =========================
   ERROR HANDLER (LAST)
========================= */

app.use(errorHandler);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
