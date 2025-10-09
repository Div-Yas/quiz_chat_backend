// routes/videos.js
const express = require('express');
const router = express.Router();
const { getVideoRecommendations } = require('../utils/geminiClient'); // We'll define this
const Pdf = require('../models/Pdf');
const authMiddleware = require('../middleware/auth');

router.post('/recommend-videos', authMiddleware, async (req, res) => {
  try {
    const { pdfId } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId is required' });
    }

    const pdf = await Pdf.findById(pdfId);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });
    if (!pdf.isDefault && pdf.uploader?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get top topics from PDF (you can also use chunks)
    const context = `PDF Title: ${pdf.originalName}\nPages: ${pdf.pages}`;
    
    const videos = await getVideoRecommendations(context);
    res.json({ videos, basedOn: pdf.originalName });
  } catch (err) {
    console.error('Video recommendation error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;