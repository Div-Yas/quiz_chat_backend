// utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Select supported model (change via .env if needed)
export const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

// Generate AI response for a student's question
export async function generateAIResponse(question, context) {
  const prompt = `
You are a helpful AI teacher assistant.
Answer the student's question clearly using the following context.

Context:
${context}

Question: ${question}
If the context lacks enough information, say politely.
`;

  try {
    const result = await model.generateContent(prompt);

    // ✅ Correctly extract text using .response.text() if available
    let answer = "";
    if (typeof result?.response?.text === "function") {
      // Some versions return a function
      answer = result.response.text();
    } else if (typeof result?.response?.text === "string") {
      answer = result.response.text;
    } else if (typeof result?.output_text === "string") {
      answer = result.output_text;
    } else if (Array.isArray(result?.response?.contents)) {
      answer = result.response.contents.map(c => c.text || "").join("\n");
    } else {
      answer = "";
    }

    return answer || "I don't have enough information to answer that.";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "I am having trouble processing your question right now.";
  }
}

export async function generateQuizQuestions(text, count = 10) {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new TypeError("Text must be a non-empty string");
  }

  // Auto-split count into ratios: 60% MCQ, 30% SAQ, 10% LAQ
  const mcqCount = Math.max(1, Math.floor(count * 0.6));
  const saqCount = Math.max(1, Math.floor(count * 0.3));
  const laqCount = Math.max(1, count - mcqCount - saqCount);

  const prompt = `
Generate a quiz from the following educational text with:
- ${mcqCount} multiple-choice questions (MCQ)
- ${saqCount} short answer questions (SAQ)
- ${laqCount} long answer questions (LAQ)

Rules:
1. MCQs: 4 options, correct answer as index (0-3), explanation.
2. SAQs: 1–2 sentence model answer.
3. LAQs: 3–5 sentence model answer.
4. All questions must be based ONLY on the provided text.
5. Return ONLY a JSON object with keys: "mcqs", "saqs", "laqs".

Text:
${text}

Output format (example):
{
  "mcqs": [
    {
      "id": "q1",
      "type": "MCQ",
      "question": "What is Newton's first law?",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "An object at rest stays at rest..."
    }
  ],
  "saqs": [
    {
      "id": "q2",
      "type": "SAQ",
      "question": "Define inertia.",
      "answer": "Inertia is the tendency of an object to resist changes in motion."
    }
  ],
  "laqs": [
    {
      "id": "q3",
      "type": "LAQ",
      "question": "Explain Newton's laws of motion with examples.",
      "answer": "Newton's first law states... [3–5 sentences]"
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();

    // Clean markdown
    aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let data;
    try {
      data = JSON.parse(aiText);
    } catch (e) {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found');
      }
    }

    // Flatten and normalize
    const questions = [];

    (data.mcqs || []).forEach((q, i) => {
      questions.push({
        id: q.id || `mcq_${i + 1}`,
        type: 'MCQ',
        question: q.question || 'Untitled MCQ',
        options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: q.explanation || 'No explanation provided'
      });
    });

    (data.saqs || []).forEach((q, i) => {
      questions.push({
        id: q.id || `saq_${i + 1}`,
        type: 'SAQ',
        question: q.question || 'Untitled SAQ',
        answer: q.answer || 'Model answer not provided'
      });
    });

    (data.laqs || []).forEach((q, i) => {
      questions.push({
        id: q.id || `laq_${i + 1}`,
        type: 'LAQ',
        question: q.question || 'Untitled LAQ',
        answer: q.answer || 'Model answer not provided'
      });
    });

    // Ensure we don’t exceed count
    return questions.slice(0, count);
  } catch (err) {
    console.error('Quiz generation failed:', err.message);
    return getDemoQuiz(count); // Keep your fallback
  }
}

// Demo quiz fallback
function getDemoQuiz(count = 10) {
  const demoQuestions = [
    {
      id: "q1",
      type: "MCQ",
      question: "What is Newton's First Law of Motion?",
      options: [
        "An object at rest stays at rest unless acted upon by force",
        "Force equals mass times acceleration",
        "Every action has an equal and opposite reaction",
        "Energy cannot be created or destroyed"
      ],
      answer: 0,
      explanation: "Newton's First Law states that an object will remain at rest or in uniform motion unless acted upon by an external force."
    },
    {
      id: "q2",
      type: "MCQ",
      question: "What does F=ma represent?",
      options: [
        "Force equals momentum times acceleration",
        "Force equals mass times acceleration",
        "Force equals mass times area",
        "Force equals motion times amplitude"
      ],
      answer: 1,
      explanation: "F=ma is Newton's Second Law, where Force equals mass multiplied by acceleration."
    },
    {
      id: "q3",
      type: "MCQ",
      question: "What is the SI unit of force?",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      answer: 1,
      explanation: "The Newton (N) is the SI unit of force, named after Isaac Newton."
    },
    {
      id: "q4",
      type: "MCQ",
      question: "What is acceleration?",
      options: [
        "The rate of change of velocity",
        "The rate of change of distance",
        "The total distance traveled",
        "The force applied to an object"
      ],
      answer: 0,
      explanation: "Acceleration is defined as the rate of change of velocity with respect to time."
    },
    {
      id: "q5",
      type: "MCQ",
      question: "What is kinetic energy?",
      options: [
        "Energy stored in an object",
        "Energy of motion",
        "Energy from heat",
        "Energy from light"
      ],
      answer: 1,
      explanation: "Kinetic energy is the energy an object possesses due to its motion."
    },
    {
      id: "q6",
      type: "MCQ",
      question: "What is potential energy?",
      options: [
        "Energy of motion",
        "Energy stored due to position",
        "Energy from electricity",
        "Energy from friction"
      ],
      answer: 1,
      explanation: "Potential energy is stored energy that depends on the position or configuration of an object."
    },
    {
      id: "q7",
      type: "MCQ",
      question: "What is the law of conservation of energy?",
      options: [
        "Energy can be created from nothing",
        "Energy can be destroyed",
        "Energy cannot be created or destroyed",
        "Energy always increases"
      ],
      answer: 2,
      explanation: "The law of conservation of energy states that energy cannot be created or destroyed, only transformed."
    },
    {
      id: "q8",
      type: "MCQ",
      question: "What is friction?",
      options: [
        "A force that helps motion",
        "A force that opposes motion",
        "A type of acceleration",
        "A form of energy"
      ],
      answer: 1,
      explanation: "Friction is a force that opposes the relative motion between two surfaces in contact."
    },
    {
      id: "q9",
      type: "MCQ",
      question: "What is gravity?",
      options: [
        "A pushing force",
        "An attractive force between masses",
        "A type of friction",
        "An electrical force"
      ],
      answer: 1,
      explanation: "Gravity is an attractive force that exists between any two masses."
    },
    {
      id: "q10",
      type: "MCQ",
      question: "What is velocity?",
      options: [
        "Speed in a specific direction",
        "Total distance traveled",
        "Force applied to object",
        "Rate of acceleration"
      ],
      answer: 0,
      explanation: "Velocity is speed in a specific direction, making it a vector quantity."
    }
  ];

  return demoQuestions.slice(0, count);
}

// Generate YouTube-friendly search queries based on PDF
export async function getVideoRecommendations(context) {
  const prompt = `
You are a helpful tutor. Based on the following PDF context, suggest 3 educational YouTube video topics that would help a student understand the material better.

PDF Context:
${context}

Return ONLY a JSON array of strings (search queries), like:
["Newton's laws of motion explained", "Kinematics class 11 physics", "Work energy power full chapter"]

Do not include any other text.
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let queries;
    try {
      queries = JSON.parse(text);
    } catch {
      // Fallback: extract array from text
      const match = text.match(/\[([\s\S]*?)\]/);
      if (match) {
        queries = JSON.parse(`[${match[1]}]`);
      } else {
        queries = [
          "Physics class 11 full chapter",
          "NCERT Physics explained",
          "Conceptual physics for beginners"
        ];
      }
    }

    // For now, return mock videos with real titles based on queries
    return queries.slice(0, 3).map((query, i) => ({
      title: query,
      duration: `${10 + i * 3}:${(30 + i * 15) % 60}`,
      views: `${(0.8 + i * 0.5).toFixed(1)}M`
    }));
  } catch (err) {
    console.error('Video query generation failed:', err);
    return mockVideos; // your existing mock
  }
}