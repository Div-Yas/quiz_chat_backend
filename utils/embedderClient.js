const axios = require('axios');
const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:5000';

module.exports.query = async function(question, pdfId, top_k = 4) {
  try {
    const url = `${EMBEDDER_URL}/query`;
    const resp = await axios.post(url, {
      question,
      pdf_id: pdfId,
      top_k
    }, { timeout: 10000 });
    return resp.data.results || [];
  } catch (error) {
    console.error('Embedder query error:', error.message);
    return [];
  }
};

module.exports.getRandomChunks = async function(pdfId, count = 10) {
  try {
    const url = `${EMBEDDER_URL}/random_chunks`;
    const resp = await axios.post(url, {
      pdf_id: pdfId,
      count
    }, { timeout: 10000 });
    return resp.data.chunks || [];
  } catch (error) {
    console.error('Get random chunks error:', error.message);
    // Return mock data if embedder not available
    return [{
      text: 'Sample physics content about motion and forces.',
      metadata: { page: 1, chunk_index: 0 }
    }];
  }
};
