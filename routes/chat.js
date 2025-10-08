const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const embedder = require('../utils/embedderClient');
const { generateAIResponse } = require('../utils/geminiClient');
const authMiddleware = require('../middleware/auth');

// Get all chats for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.userId })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ chats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Get specific chat
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.chatId, 
      user: req.userId 
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ chat });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Create new chat
router.post('/new', authMiddleware, async (req, res) => {
  try {
    const { title, pdfId } = req.body;
    const chat = await Chat.create({
      user: req.userId,
      title: title || 'New Chat',
      pdfId: pdfId || null,
      messages: []
    });
    res.json({ chat });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Send message to chat
router.post('/:chatId/message', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'no question' });

    const chat = await Chat.findOne({ 
      _id: req.params.chatId, 
      user: req.userId 
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Add user message
    chat.messages.push({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    // Get relevant chunks from embedder
    const chunks = await embedder.query(question, chat.pdfId || 'all', 4);
    const context = chunks.map(c => 
      `Page ${c.metadata.page || 'N/A'}: ${c.text}`
    ).join('\n\n');

    // Generate AI response
    const aiResponse = await generateAIResponse(question, context);
    const citations = chunks.map(c => ({
      page: c.metadata.page || null,
      snippet: c.text.slice(0, 200)
    }));

    // Add assistant message
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      citations: citations,
      timestamp: new Date()
    });

    // Update chat title if first message
    if (chat.messages.length === 2) {
      chat.title = question.slice(0, 50) + (question.length > 50 ? '...' : '');
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.json({ 
      answer: aiResponse, 
      citations,
      chat: {
        _id: chat._id,
        title: chat.title,
        messages: chat.messages
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Delete chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.params.chatId, user: req.userId });
    res.json({ message: 'Chat deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;