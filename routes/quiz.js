const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const Pdf = require('../models/Pdf');
const embedder = require('../utils/embedderClient');
const { generateQuizQuestions } = require('../utils/geminiClient');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const pdf = require('pdf-parse');

// Generate quiz with 10 questions from selected PDF
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { pdfId: pdfIdRaw, count = 10 } = req.body;
    const pdfId = String(pdfIdRaw);

    if (!pdfId) return res.status(400).json({ error: 'pdfId is required' });

    const pdfDoc = await Pdf.findById(pdfId);
    if (!pdfDoc) return res.status(404).json({ error: 'PDF not found' });
    if (!pdfDoc.isDefault && pdfDoc.uploader?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get chunks from embedder
    const chunks = await embedder.getRandomChunks(pdfId, Math.ceil(count / 2)); // fewer chunks, more context per chunk
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No content available for this PDF' });
    }

    const context = chunks.map(c => c.text).join('\n\n');

    // Generate mixed quiz
    const questions = await generateQuizQuestions(context, count);

    res.json({
      pdfId,
      pages: [{ page: 1, quiz: questions }] // keep your existing structure
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz and calculate score
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { pdfId, answers, questions } = req.body;
    
    if (!answers || !questions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate score
    let correct = 0;
    let total = 0;
    
    if (questions && Array.isArray(questions)) {
      questions.forEach(q => {
        if (q.type === 'MCQ' && q.answer !== undefined) {
          total++;
          // Convert both to numbers for comparison
          const userAnswer = parseInt(answers[q.id]);
          const correctAnswer = parseInt(q.answer);
          
          if (userAnswer === correctAnswer) {
            correct++;
          }
        }
      });
    }
    
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Store attempt in database
    await QuizAttempt.create({
      user: req.userId,
      pdf: pdfId || null,
      answers,
      score
    });
    
    res.json({ 
      score, 
      correct, 
      total,
      message: score === 100 ? 'Perfect score!' : score >= 80 ? 'Great job!' : 'Keep practicing!'
    });
  } catch (e) {
    console.error('Submit quiz error:', e);
    res.status(500).json({ message: 'Server error' });
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
    console.error('Quiz history error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;