// ---------------------------------------------------------------------------
// TicketFlow — Main Server Entry Point
// ---------------------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { startInventoryWorker } = require('./workers/inventoryWorker');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// ---------------------------------------------------------------------------
// Production-grade CORS Configuration
// Restricts incoming cross-origin requests to authorized frontend origins.
// Webhook callers (e.g. Razorpay servers) send requests without 'Origin' headers
// and are permitted through.
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, curl, webhooks) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
  })
);

// Capture raw body buffer for crypto webhook signature verification (Razorpay)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Dedicated Razorpay Webhook Endpoint (Public, signature-verified)
app.post(
  '/api/webhooks/razorpay',
  require('./controllers/paymentController').handleWebhook
);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'TicketFlow API is running' });
});

// ---------------------------------------------------------------------------
// Centralized Error Handler (must be after routes)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // Start the inventory sweeper cron job after DB is connected
  startInventoryWorker();

  app.listen(PORT, () => {
    console.log(`🚀 TicketFlow server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;
