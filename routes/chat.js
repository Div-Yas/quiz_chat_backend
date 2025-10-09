const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const embedder = require('../utils/embedderClient');
const { generateAIResponse, generateQuizQuestions } = require('../utils/geminiClient');
const authMiddleware = require('../middleware/auth');
const Pdf = require('../models/Pdf');

// Get all chats for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.userId })
      .select('title updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ chats });
  } catch (e) {
    console.error('Get chat history error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chat
router.post('/new', authMiddleware, async (req, res) => {
  try {
    const { title, pdfId } = req.body;

    // Only set pdfId if it's a valid ObjectId
    let pdfObjectId = null;
    if (pdfId && mongoose.Types.ObjectId.isValid(pdfId)) {
      pdfObjectId = pdfId;
    }

    const chat = await Chat.create({
      user: req.userId,
      title: title || 'New Chat',
      pdfId: pdfObjectId, // null if general chat
      messages: [],
    });
    res.json({ chat });
  } catch (e) {
    console.error('Create chat error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post("/:chatId/message", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "No question provided" });

    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Add user's message
    chat.messages.push({ role: "user", content: question, timestamp: new Date() });

    // Get all PDFs uploaded by the user
    const userPDFs = await Pdf.find({ userId: req.userId });
    const userPDFIds = userPDFs.map(p => p._id.toString());

    // Get default PDFs
    const defaultPDFs = await Pdf.find({ isDefault: true });
    const defaultPDFIds = defaultPDFs.map(p => p._id.toString());

    // Combine all PDFs
    const allPDFIds = [...userPDFIds, ...defaultPDFIds];
    console.log("All PDF IDs for user:", allPDFIds, question);
 
    // Query embeddings across all PDFs
    const chunks = await embedder.query(question, allPDFIds, 4);
    console.log("Retrieved chunks:", chunks);

    const context = chunks.map(c => `Page ${c.metadata.page || "N/A"}: ${c.text}`).join("\n\n");

    const citations = chunks.map(c => ({
      page: c.metadata.page || null,
      snippet: c.text.slice(0, 200),
    }));

    // Generate AI response
    const aiResponse = await generateAIResponse(question, context);

    // Add assistant message
    chat.messages.push({
      role: "assistant",
      content: aiResponse,
      citations,
      timestamp: new Date(),
    });

    // Update chat title if it's new
    if (chat.messages.length === 2) {
      chat.title = question.slice(0, 50) + (question.length > 50 ? "..." : "");
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      answer: aiResponse,
      citations,
      chat: { _id: chat._id, title: chat.title, messages: chat.messages },
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.params.chatId, user: req.userId });
    res.json({ message: 'Chat deleted' });
  } catch (e) {
    console.error('Delete chat error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    console.log("Fetching chat with ID:", req.params.chatId);
    
    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ chat });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
