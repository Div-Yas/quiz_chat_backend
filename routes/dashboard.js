const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get quiz statistics
    const quizAttempts = await QuizAttempt.find({ user: req.userId }).lean();
    const totalQuizzes = quizAttempts.length;
    const avgScore = totalQuizzes > 0 
      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / totalQuizzes)
      : 0;
    
    // Get recent scores
    const recentScores = quizAttempts
      .slice(-5)
      .map(q => q.score);
    
    // Simple strengths/weaknesses (can be enhanced with topic analysis)
    const strengths = avgScore >= 80 ? ['Problem Solving', 'Conceptual Understanding'] : ['Effort', 'Dedication'];
    const weaknesses = avgScore < 80 ? ['Practice More', 'Review Basics'] : ['Advanced Topics'];
    
    // Get chat count
    const totalChats = await Chat.countDocuments({ user: req.userId });
    
    res.json({
      overallScore: avgScore,
      quizzesCompleted: totalQuizzes,
      totalChats,
      recentScores,
      strengths,
      weaknesses,
      grade: avgScore >= 90 ? 'A+' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : 'D'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;