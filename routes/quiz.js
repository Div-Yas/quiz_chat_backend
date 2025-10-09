const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const Pdf = require('../models/Pdf');
const embedder = require('../utils/embedderClient');
const { generateQuizQuestions } = require('../utils/geminiClient');
const authMiddleware = require('../middleware/auth');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.post("/generate", async (req, res) => {
  try {
    const { pdfId, page } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: "pdfId is required" });
    }

    if (!page || typeof page !== "number") {
      return res.status(400).json({ error: "Page number is required" });
    }

    // Load PDF file (assumes PDFs are stored in ./uploads)
    const pdfPath = path.join(process.cwd(), "uploads", `${pdfId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "PDF not found" });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // pdfData.text contains all pages text separated by \n
    const pagesText = pdfData.text.split("\n\n"); // rough page split
    const pageText = pagesText[page - 1]; // zero-based index

    if (!pageText || pageText.trim().length === 0) {
      return res.status(400).json({ error: "No content found on this page" });
    }

    // Generate quiz questions using AI
    let generatedQuiz = [];
    try {
      generatedQuiz = await generateQuizQuestions(pageText);
      await sleep(1500); // throttle
    } catch (err) {
      console.error(`Quiz generation error for page ${page}:`, err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json({
      pdfId,
      pages: [
        {
          page,
          quiz: generatedQuiz,
        },
      ],
    });
  } catch (err) {
    console.error("Quiz route error:", err);
    res.status(500).json({ error: err.message });
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