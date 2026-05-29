"""Study Service — PDF analysis, quiz generation, revision planning"""

import io
import json
from typing import Optional
from services.gemini_service import gemini

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract raw text from PDF bytes."""
    if not PDF_AVAILABLE:
        return "PDF parsing library not installed. Please install PyPDF2."
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip() or "Could not extract text from this PDF."
    except Exception as e:
        return f"PDF extraction error: {str(e)}"


def generate_summary(text: str) -> str:
    """Generate a comprehensive summary from document text."""
    prompt = (
        "You are an expert academic summarizer. Analyze the following document and provide:\n"
        "1. A brief overview (2-3 sentences)\n"
        "2. Key concepts (bullet points)\n"
        "3. Important definitions or formulas\n"
        "4. Main takeaways for exam preparation\n\n"
        f"Document:\n{text[:8000]}"
    )
    return gemini.generate_text(prompt)


def generate_quiz(topic: str, num_questions: int = 5, context: str = "") -> list:
    """Generate multiple-choice quiz questions."""
    prompt = (
        f"Generate exactly {num_questions} multiple-choice questions about '{topic}'. "
        f"{'Use this context: ' + context[:3000] if context else ''}\n\n"
        "Return ONLY a valid JSON array with this exact format:\n"
        '[{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "..."}]'
    )
    try:
        result = gemini.generate_text(prompt)
        # Try to parse JSON from response
        start = result.find("[")
        end = result.rfind("]") + 1
        if start != -1 and end > start:
            return json.loads(result[start:end])
    except Exception:
        pass

    # Fallback mock questions
    return [
        {
            "question": f"What is the core concept of {topic}?",
            "options": ["A) Foundation theory", "B) Applied method", "C) Both A and B", "D) Neither"],
            "answer": "C",
            "explanation": f"The core concept of {topic} combines both foundational theory and applied methods."
        }
        for i in range(min(num_questions, 3))
    ]


def generate_revision_plan(subject: str, exam_date: str, hours_per_day: float = 3.0) -> str:
    """Generate a detailed, day-by-day revision plan."""
    prompt = (
        f"Create a detailed revision plan for '{subject}'.\n"
        f"Exam date: {exam_date}\n"
        f"Available study hours per day: {hours_per_day}\n\n"
        "Include:\n"
        "- Day-by-day topic breakdown\n"
        "- Time blocks for each topic\n"
        "- Practice test schedule\n"
        "- Rest and review days\n"
        "- Tips for each phase\n\n"
        "Format with clear headings and bullet points."
    )
    return gemini.generate_text(prompt)


def generate_important_questions(subject: str, text: str = "") -> str:
    """Predict high-probability exam questions."""
    prompt = (
        f"For the subject '{subject}', predict the 10 most likely exam questions. "
        f"{'Based on this material: ' + text[:5000] if text else ''}\n\n"
        "Format each question with:\n"
        "- The question\n"
        "- Why it's likely to appear\n"
        "- Key points to include in the answer"
    )
    return gemini.generate_text(prompt)


# In-memory session store (replace with DB in production)
study_sessions = []


def save_session(user_id: str, subject: str, summary: str, quiz: list) -> dict:
    session = {
        "id": f"session_{len(study_sessions) + 1}",
        "user_id": user_id,
        "subject": subject,
        "summary": summary,
        "quiz": quiz,
        "created_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
    study_sessions.append(session)
    return session


def get_sessions(user_id: str = "default") -> list:
    return [s for s in study_sessions if s.get("user_id") == user_id]
