const axios = require('axios');
const Pdf = require('../models/Pdf');
const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:5000';

module.exports.query = async function(question, pdfIds, top_k = 4) {
  try {
    const url = `${EMBEDDER_URL}/query`;
    const resp = await axios.post(url, {
      question,
      pdf_ids: pdfIds, // ✅ send as array
      top_k
    }, { timeout: 10000 });
    return resp.data.results || [];
  } catch (error) {
    console.error('Embedder query error:', error.message);
    return [];
  }
};

module.exports.getRandomChunks = async function(pdfId, countPerPdf = 10) {
  try {
    let pdfIds = [];
    
    if (pdfId === "all") {
      // Fetch all PDFs from DB
      const allPdfs = await Pdf.find({});
      pdfIds = allPdfs.map(p => p._id.toString());
    } else {
      pdfIds = [pdfId];
    }

    let chunks = [];
    for (const id of pdfIds) {
      const url = `${EMBEDDER_URL}/random_chunks`;
      const resp = await axios.post(url, {
        pdf_id: id,
        count: countPerPdf
      }, { timeout: 10000 });

      chunks.push(...(resp.data.chunks || []));
    }

    return chunks;
  } catch (error) {
    console.error('Get random chunks error:', error.message);
    // Return mock data if embedder not available
    return Array.from({ length: countPerPdf * 5 }, (_, i) => ({
      text: `Sample content chunk ${i + 1}`,
      metadata: { page: Math.floor(i / 10) + 1, chunk_index: i }
    }));
  }
};

