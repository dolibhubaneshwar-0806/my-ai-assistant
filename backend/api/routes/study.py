"""Study Routes"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import study_service

router = APIRouter()

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    context: Optional[str] = ""

class RevisionPlanRequest(BaseModel):
    subject: str
    exam_date: str
    hours_per_day: float = 3.0

class ImportantQuestionsRequest(BaseModel):
    subject: str
    text: Optional[str] = ""

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    content = await file.read()
    text = study_service.extract_pdf_text(content)
    summary = study_service.generate_summary(text)
    quiz = study_service.generate_quiz(file.filename.replace(".pdf",""), context=text[:3000])
    session = study_service.save_session("default", file.filename, summary, quiz)
    return {"session_id": session["id"], "filename": file.filename, "summary": summary, "quiz": quiz, "text_length": len(text)}

@router.post("/quiz")
async def generate_quiz(req: QuizRequest):
    quiz = study_service.generate_quiz(req.topic, req.num_questions, req.context)
    return {"topic": req.topic, "questions": quiz, "count": len(quiz)}

@router.post("/plan")
async def generate_revision_plan(req: RevisionPlanRequest):
    plan = study_service.generate_revision_plan(req.subject, req.exam_date, req.hours_per_day)
    return {"subject": req.subject, "exam_date": req.exam_date, "plan": plan}

@router.post("/important-questions")
async def important_questions(req: ImportantQuestionsRequest):
    questions = study_service.generate_important_questions(req.subject, req.text)
    return {"subject": req.subject, "questions": questions}

@router.get("/sessions")
async def get_sessions(user_id: str = "default"):
    sessions = study_service.get_sessions(user_id)
    return {"sessions": sessions, "count": len(sessions)}
