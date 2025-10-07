const axios = require('axios');
const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:5000';

module.exports.query = async function(question, pdfId, top_k=4){
  const url = `${EMBEDDER_URL}/query`;
  const resp = await axios.post(url, { question, pdf_id: pdfId, top_k });
  return resp.data.results || [];
};
