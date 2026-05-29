"""Study Module Prompts"""

STUDY_SYSTEM_PROMPT = """You are an expert academic tutor and study coach. Your role is to:
- Analyze study materials with precision and depth
- Break down complex concepts into digestible chunks
- Generate practice questions that test real understanding
- Create optimized revision plans tailored to exam dates
- Provide encouragement and study strategies
Always be specific, structured, and actionable in your responses."""

PDF_SUMMARY_PROMPT = """Analyze the following document and provide a comprehensive summary:

Document Content:
{text}

Please provide:
1. **Overview** (2-3 sentences)
2. **Key Concepts** (bullet points with brief explanations)
3. **Important Formulas/Definitions** (if applicable)
4. **Main Takeaways** for exam preparation
5. **Suggested Study Focus Areas**

Format with clear headings and make it exam-ready."""

QUIZ_GENERATION_PROMPT = """Generate {num_questions} multiple-choice questions about: {topic}

Requirements:
- Each question must test conceptual understanding, not just memorization
- Include one clearly correct answer and three plausible distractors
- Add a brief explanation for the correct answer
- Vary difficulty: 30% easy, 50% medium, 20% hard

Return ONLY a valid JSON array:
[{{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "...", "difficulty": "easy|medium|hard"}}]"""

REVISION_PLAN_PROMPT = """Create a detailed revision plan for:
Subject: {subject}
Exam Date: {exam_date}
Daily Study Hours: {hours_per_day}

Include:
- Day-by-day topic schedule
- Pomodoro blocks (25 min study / 5 min break)
- Mock test schedule (every 3 days)
- Weak topic reinforcement days
- Pre-exam buffer days
- Daily goals and milestones

Format with clear structure, dates, and motivational checkpoints."""

IMPORTANT_QUESTIONS_PROMPT = """Based on the provided study material, predict the 10 most likely exam questions.

For each question provide:
1. The question itself
2. Why it's high-probability
3. Key points the answer must include
4. Estimated marks weightage

Focus on: definitions, derivations, applications, comparison questions, and problem-solving."""
