require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const pdfRoutes = require('./routes/pdfs');
const chatRoutes = require('./routes/chat');
const quizRoutes = require('./routes/quiz');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchart';
mongoose.connect(MONGO)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('Mongo connect error', err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Backend listening ${PORT}`));
