const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  citations: [{
    page: Number,
    snippet: String
  }],
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  pdfId: { type: Schema.Types.ObjectId, ref: 'Pdf' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);