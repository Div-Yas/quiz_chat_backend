const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Pdf = require('../models/Pdf');
const axios = require('axios');

const uploadDir = path.join(process.cwd(),'uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDFs allowed'));
    cb(null, true);
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ message: 'no file' });
    const pdf = await Pdf.create({ filename: req.file.filename, originalName: req.file.originalname, path: req.file.path });
    // trigger the embedding worker to chunk+embed
    try {
      await axios.post((process.env.EMBEDDER_URL||'http://localhost:5000') + '/chunk_and_embed', { file_path: req.file.path, doc_id: pdf._id.toString() }, { timeout: 20000 });
    } catch (err) {
      console.warn('embed trigger failed', err?.message);
    }
    res.json({ pdf });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'upload failed' });
  }
});

module.exports = router;
