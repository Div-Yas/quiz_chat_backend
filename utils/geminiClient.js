const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function generateAIResponse(question, context) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, returning demo response');
    return `Based on the context: "${question}" - This is a demo answer. Please set GEMINI_API_KEY for production use.`;
  }

  try {
    const prompt = `You are a helpful AI teacher assistant. Answer the student's question based on the following context from their coursebook.

Context:
${context}

Student Question: ${question}

Please provide a clear, educational answer. If the context doesn't contain enough information, say so politely.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    return `I apologize, but I'm having trouble processing your question right now. Please try again.`;
  }
}

async function generateQuizQuestions(context, count = 5) {
  if (!GEMINI_API_KEY) {
    return getDemoQuiz();
  }

  try {
    const prompt = `Based on the following educational content, generate ${count} quiz questions with a mix of:
- 60% Multiple Choice Questions (MCQ) with 4 options
- 20% Short Answer Questions (SAQ)
- 20% Long Answer Questions (LAQ)

Content:
${context}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "q1",
    "type": "MCQ",
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Explanation text"
  }
]

For SAQ and LAQ, omit the "options" and "answer" fields.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getDemoQuiz();
  } catch (error) {
    console.error('Quiz generation error:', error.response?.data || error.message);
    return getDemoQuiz();
  }
}

function getDemoQuiz() {
  return [
    {
      id: 'q1',
      type: 'MCQ',
      question: 'What is inertia?',
      options: ['Resistance to change in motion', 'Force applied', 'Mass of object', 'Acceleration'],
      answer: 0,
      explanation: 'Inertia is the tendency of an object to resist changes in its state of motion.'
    },
    {
      id: 'q2',
      type: 'SAQ',
      question: 'Explain Newton\'s First Law of Motion.',
      explanation: 'An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.'
    }
  ];
}

module.exports = { generateAIResponse, generateQuizQuestions };
