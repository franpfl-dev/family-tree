/**
 * config/db.js
 * MongoDB connection via Mongoose.
 * Exits the process on connection failure — the server
 * cannot serve meaningful data without a database.
 */

const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 7+ no longer needs useNewUrlParser / useUnifiedTopology
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
