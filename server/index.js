/**
 * index.js — Express entry point
 * Family Tree API Server
 */

require('dotenv').config();
require('express-async-errors');   // patches async route errors → error handler

const express      = require('express');
const cors         = require('cors');
const connectDB    = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const errorHandler = require('./middleware/errorHandler');

const treesRouter   = require('./routes/trees');
const personsRouter = require('./routes/persons');
const imagesRouter  = require('./routes/images');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB & Cloudinary ──────────────────────────────────────────
connectDB();
configureCloudinary();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Increase JSON limit for base64 image payloads (≤ 5 MB per photo)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/trees',   treesRouter);
app.use('/api/persons', personsRouter);
app.use('/api/images',  imagesRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Family Tree API running on http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
