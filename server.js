require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const pdfRoutes = require('./routes/pdfs');
const chatRoutes = require('./routes/chat');
const quizRoutes = require('./routes/quiz');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/upload', uploadRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchart';

// Connect to MongoDB and start server
mongoose.connect(MONGO)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Run seed inline (don't require the external file that calls process.exit)
    try {
      const Pdf = require('./models/Pdf');
      const existingCount = await Pdf.countDocuments({ isDefault: true });
      console.log(`Default PDF count: ${existingCount}`);
      
      if (existingCount >= 3) {
        console.log('✅ Default PDFs already exist');
      } else {
        console.log('⚠️  Default PDFs not seeded. Run: node scripts/seedDefaultPDFs.js');
      }
    } catch (err) {
      console.warn('Seed check failed:', err.message);
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('Try: taskkill /F /IM node.exe');
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\nMake sure MongoDB is running!');
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});