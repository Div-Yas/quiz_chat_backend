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

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchart';
mongoose.connect(MONGO)
  .then(() => {
    console.log('MongoDB connected');
    require('./scripts/seedDefaultPDFs');
  })
  .catch(err => console.error('Mongo connect error', err));

const PORT = 6000;

const server = app.listen(PORT, () =>
  console.log(`✅ Server bound successfully on port ${PORT}`)
);

server.on('error', err => console.error('❌ Listen error', err));
