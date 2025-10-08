const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const Pdf = require('../models/Pdf');
const embedder = require('../utils/embedderClient');
const { generateQuizQuestions } = require('../utils/geminiClient');
const authMiddleware = require('../middleware/auth');

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { pdfId, count = 5 } = req.body;
    
    // Get chunks from selected PDF(s)
    const chunks = await embedder.getRandomChunks(pdfId || 'all', 10);
    const context = chunks.map(c => c.text).join('\n\n');
    
    // Generate quiz using Gemini
    const quiz = await generateQuizQuestions(context, count);
    
    res.json({ quiz, pdfId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { pdfId, answers, questions } = req.body;
    
    // Calculate score
    let correct = 0;
    let total = 0;
    
    if (questions && Array.isArray(questions)) {
      questions.forEach(q => {
        if (q.type === 'MCQ' && q.answer !== undefined) {
          total++;
          if (answers[q.id] === q.answer) {
            correct++;
          }
        }
      });
    }
    
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Store attempt
    await QuizAttempt.create({
      user: req.userId,
      pdf: pdfId || null,
      answers,
      score
    });
    
    res.json({ score, correct, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Get user's quiz history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.userId })
      .populate('pdf', 'originalName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ attempts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;