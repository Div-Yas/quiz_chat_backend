const express = require('express');
const router = express.Router();
const embedder = require('../utils/embedderClient');

router.post('/', async (req,res) => {
  try {
    const { question, pdfId } = req.body;
    if(!question) return res.status(400).json({ message: 'no question' });
    const chunks = await embedder.query(question, pdfId, 4);
    const context = chunks.map(c => `Pg ${c.metadata.page || c.metadata.chunk_index}: ${c.text}`).join('\n\n');

    // TODO: call Gemini (GenAI) to generate final answer with the context. For now return a placeholder:
    const answer = `This is a demo answer for: \"${question}\". Replace this with an actual call to Gemini for a production build.`;
    const citations = chunks.map(c => ({ page: c.metadata.page || null, snippet: c.text.slice(0,200) }));

    res.json({ answer, citations });
  } catch(e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
