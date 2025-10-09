// utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Select supported model (change via .env if needed)
export const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

const client = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
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

// Generate quiz questions based on content
export async function generateQuizQuestions(text) {
  if (typeof text !== "string") {
    throw new TypeError("Text must be a string for generateQuizQuestions");
  }

  try {
    const prompt = `
      Generate multiple-choice and short-answer questions from the following text.
      Include explanation for answers.

      Text:
      ${text}
    `;

    const response = await client.generateContent({
      model: "gemini-2.5-flash",
      temperature: 0.2,
      maxOutputTokens: 1000,
      prompt,
    });

    // Extract content as string
    const aiText = response?.candidates?.[0]?.content;

    if (!aiText || typeof aiText !== "string") {
      throw new Error("No valid text returned from Gemini API");
    }

    // Basic parsing logic (adjust to your AI output format)
    const quizzes = [];
    const entries = aiText.split("\n\n"); // Split questions by double line break

    for (const entry of entries) {
      const match = entry.match(/Q\d+: (.+)/i);
      if (match) {
        quizzes.push({
          question: match[1].trim(),
          type: entry.includes("MCQ") ? "MCQ" : "SAQ",
          options: entry.includes("MCQ")
            ? entry.match(/Options: (.+)/i)?.[1].split(",").map((o) => o.trim())
            : undefined,
          answer: entry.includes("Answer:") ? entry.match(/Answer: (.+)/i)[1] : undefined,
          explanation: entry.includes("Explanation:") ? entry.match(/Explanation: (.+)/i)[1] : undefined,
        });
      }
    }

    return quizzes;
  } catch (err) {
    console.error("Quiz generation error:", err.message);
    throw err;
  }
}

// Demo quiz fallback
function getDemoQuiz() {
  return [
    {
      id: "q1",
      type: "MCQ",
      question: "What is inertia?",
      options: ["Resistance to change in motion", "Force applied", "Mass of object", "Acceleration"],
      answer: 0,
      explanation: "Inertia is the tendency of an object to resist changes in its state of motion."
    },
    {
      id: "q2",
      type: "SAQ",
      question: "Explain Newton's First Law of Motion.",
      explanation: "An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force."
    }
  ];
}
