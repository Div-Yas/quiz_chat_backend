const express = require('express');
const router = express.Router();
const Pdf = require('../models/Pdf');

router.get('/', async (req,res) => {
  const items = await Pdf.find().sort({ createdAt: -1 }).lean();
  res.json({ pdfs: items });
});

module.exports = router;
