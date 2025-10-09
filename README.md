Quiz & Chat Learning Platform – Backend
AI-Powered Quiz Generation, PDF Q&A, and Video Recommendations from Educational Documents 

This repository contains the Node.js + Express backend for an intelligent learning platform that lets users upload or select PDFs (e.g., NCERT textbooks), generate quizzes, ask questions, and get video recommendations—all powered by Google Gemini LLM and ChromaDB vector embeddings.

🔗 Frontend companion: quiz_chat_frontend
📚 Sample PDFs: NCERT Physics Class 11 (Parts 1 & 2 + Exemplar)

✅ What We’ve Built
1. Smart Quiz Generator
Generates MCQs, SAQs, and LAQs from any PDF
Includes correct answers + explanations
Supports retries and fallbacks if AI fails
Auto-grades MCQs; shows model answers for SAQ/LAQ
2. PDF-Powered Q&A Chat
Uses semantic search (ChromaDB + Gemini embeddings)
Answers student questions using only content from selected PDFs
Prevents hallucination by grounding responses in source material
3. AI Video Recommendations
Analyzes PDF content → suggests relevant YouTube video topics
Click any recommendation to open in YouTube
(Future: embed real videos via YouTube Data API)
4. Secure & Scalable Architecture
JWT-based authentication
Role-based access (user-owned vs. default PDFs)
MongoDB for metadata, ChromaDB for vector storage
Modular API design (/api/quiz, /api/chat, /api/videos)
🛠️ How It Works
graph LR
A[User uploads/selects PDF] --> B[MongoDB stores metadata]
B --> C[Python Embedder: extracts text → chunks → embeddings]
C --> D[ChromaDB stores vectors + metadata]
D --> E1[Quiz: LLM generates questions from chunks]
D --> E2[Chat: LLM answers using retrieved context]
D --> E3[Videos: LLM suggests topics → YouTube links]

PDF Ingestion
On upload or seeding, PDF is split into chunks
Chunks are embedded using Gemini Text Embedding
Stored in ChromaDB with doc_id = PDF._id
Quiz Generation
Fetch random chunks → send to Gemini Pro
Prompt: “Generate 5 MCQs, 3 SAQs, 2 LAQs with answers”
Return structured JSON → frontend renders interactive quiz
Q&A Chat
User question → embedded → ChromaDB similarity search
Top chunks → passed as context to Gemini
Response grounded in PDF content
Video Recommendations
LLM analyzes PDF → outputs 3 YouTube search queries
Frontend displays cards → click opens youtube.com/results?q=...
🚀 Quick Setup
Prerequisites
Node.js v18+
MongoDB
Google Cloud account (for Gemini API)
(Optional) NCERT PDFs or your own educational documents
1. Clone & Install
bash
git clone https://github.com/Div-Yas/quiz_chat_backend.git
cd quiz_chat_backend

# Backend (Node.js)
npm install

2. Environment Variables
Create .env in root:

env

# Node.js Backend
MONGO_URI=mongodb://localhost:27017/quizchat
GEMINI_API_KEY=your_gemini_api_key_here
EMBEDDER_URL=http://localhost:5000
PORT=5001

3. Run Services
bash

# Terminal 1: Seed default PDFs (run once)
npm run seed

# Terminal 3: Start backend
npm start
4. Use with Frontend
Start quiz_chat_frontend
Ensure VITE_API_BASE_URL=http://localhost:5001 in frontend .env
🔮 Future Enhancements
YouTube Data API Integration
Replace search links with real video thumbnails, durations, and IDs
SAQ Auto-Grading
Use LLM to compare student answers with model answers
Multi-PDF Quizzes
Generate quizzes from multiple selected PDFs
Progress Tracking
Store quiz history, weak topics, and improvement metrics
Mobile App
React Native wrapper for on-the-go learning
Offline Mode
Cache embeddings and LLM responses for low-connectivity areas
Admin Dashboard
Manage PDFs, users, and content moderation

Project Structure

quiz_chat_backend/
├── scripts/
│   └── seedDefaultPDFs.js # Seeds NCERT PDFs + triggers embedding
├── src/
│   ├── api/               # Axios API clients
│   ├── models/            # Mongoose schemas (Pdf, QuizAttempt)
│   ├── routes/            # Express routes (quiz, chat, videos, auth)
│   ├── store/             # Redux slices (auth, pdf)
│   └── utils/             # Gemini client, embedder client
├── .env                   # Environment variables
└── server.js              # Main entry point
