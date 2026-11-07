require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const Transaction = require('./models/Transaction');

// Set fallback DNS for reliable MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS server customization not supported:', dnsErr.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic or configurable CORS
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Database connection helper
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

let isConnecting = false;
async function connectDB() {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully to:', mongoose.connection.name || 'database');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    isConnecting = false;
  }
}

// Initial DB connection attempt
connectDB();

// Database status middleware for transactional routes
const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // Attempt reconnect in background
    connectDB();
    return res.status(503).json({
      message: 'Database is currently disconnected. Please check your MongoDB connection or credentials.'
    });
  }
  next();
};

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/transactions', requireDB, async (req, res) => {
  try {
    const { type, category, search } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch transactions', error: error.message });
  }
});

app.post('/api/transactions', requireDB, async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: 'Could not create transaction', error: error.message });
  }
});

app.put('/api/transactions/:id', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: 'Could not update transaction', error: error.message });
  }
});

app.delete('/api/transactions/:id', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete transaction', error: error.message });
  }
});

// Serve frontend build if present (e.g. in unified Render deployment)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', () => {
    if (server) {
      server.close(() => {
        mongoose.connection.close(false);
      });
    }
  });
}

module.exports = app;
