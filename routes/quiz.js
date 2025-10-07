const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');

router.post('/generate', async (req,res) => {
  // production: call embedder for chunks then a Gemini generation prompt to create MCQs/SAQs/LAQs
  const demo = [{ id:'q1', type:'MCQ', question:'What is inertia?', options:['resistance to motion','force','mass','acceleration'], answer:0, explanation:'Inertia is the tendency to resist changes in motion.' }];
  res.json({ quiz: demo });
});

router.post('/submit', async (req,res) => {
  const { userId, pdfId, answers } = req.body;
  // scoring logic should come from LLM or deterministic checker; demo uses fixed score
  const score = 80;
  await QuizAttempt.create({ user: userId, pdf: pdfId, answers, score });
  res.json({ score });
});

module.exports = router;
