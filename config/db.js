// ============================================
// MONGODB DATABASE CONNECTION
// ============================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ✅ MONGODB CONNECTED SUCCESSFULLY   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ❌ MONGODB CONNECTION FAILED        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('Error:', error.message);
    console.log('');
    process.exit(1);
  }
};

module.exports = connectDB;