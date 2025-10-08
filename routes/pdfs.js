const express = require('express');
const router = express.Router();
const Pdf = require('../models/Pdf');
const authMiddleware = require('../middleware/auth');

// Get all PDFs (default + user uploaded)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get default PDFs and user's uploaded PDFs
    const defaultPdfs = await Pdf.find({ isDefault: true }).sort({ createdAt: -1 }).lean();
    const userPdfs = await Pdf.find({ 
      uploader: req.userId,
      isDefault: { $ne: true }
    }).sort({ createdAt: -1 }).lean();
    
    res.json({ 
      pdfs: [...defaultPdfs, ...userPdfs],
      defaultPdfs,
      userPdfs
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Get single PDF
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id).lean();
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    
    // Check access: either default or uploaded by user
    if (!pdf.isDefault && pdf.uploader?.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ pdf });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;