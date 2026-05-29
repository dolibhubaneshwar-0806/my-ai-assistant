"""Study intelligence workflow using LangGraph framework structure"""

from typing import Dict, List, Any, TypedDict, Optional
from services.gemini_service import gemini

try:
    from langgraph.graph import StateGraph, END
    import json
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False


# Graph State representation
class StudyState(TypedDict):
    input_text: str
    pdf_text: Optional[str]
    subject: str
    intent: str
    summary: Optional[str]
    quiz: Optional[List[Dict[str, Any]]]
    revision_plan: Optional[str]
    important_questions: Optional[str]
    error: Optional[str]


def analyze_intent(state: StudyState) -> StudyState:
    """Analyze the user request to determine what they want to study."""
    prompt = (
        "Classify this study request intent:\n"
        f"Input: {state['input_text']}\n\n"
        "Available Intents: summary, quiz, revision_plan, important_questions, general\n"
        "Return ONLY the classified word."
    )
    intent = gemini.generate_text(prompt).strip().lower()
    if intent not in ["summary", "quiz", "revision_plan", "important_questions"]:
        intent = "summary"
    state["intent"] = intent
    return state


def extract_content(state: StudyState) -> StudyState:
    """Parse or chunk source document content based on state information."""
    if not state.get("pdf_text"):
        state["pdf_text"] = "Foundational theories and definitions for " + state.get("subject", "General Subject")
    return state


def generate_output(state: StudyState) -> StudyState:
    """Trigger specific AI engine tasks using prompt configurations."""
    intent = state.get("intent", "summary")
    pdf_text = state.get("pdf_text", "")
    subject = state.get("subject", "General Subject")

    if intent == "summary":
        state["summary"] = gemini.analyze_pdf(pdf_text, "summary")
    elif intent == "quiz":
        quiz_raw = gemini.analyze_pdf(pdf_text, "quiz")
        try:
            state["quiz"] = json.loads(quiz_raw)
        except Exception:
            state["quiz"] = [{"question": "What is the primary focus of this chapter?", "options": ["A", "B", "C", "D"], "answer": "A"}]
    elif intent == "revision_plan":
        state["revision_plan"] = gemini.generate_text(f"Create a revision plan for {subject} using: {pdf_text[:2000]}")
    elif intent == "important_questions":
        state["important_questions"] = gemini.analyze_pdf(pdf_text, "important_questions")
    
    return state


def format_response(state: StudyState) -> StudyState:
    """Final post-processing node to finalize return models."""
    return state


def run_study_workflow(input_text: str, subject: str, pdf_text: Optional[str] = None) -> Dict[str, Any]:
    """Execute Study Intelligence multi-agent workflow."""
    initial_state: StudyState = {
        "input_text": input_text,
        "pdf_text": pdf_text,
        "subject": subject,
        "intent": "summary",
        "summary": None,
        "quiz": None,
        "revision_plan": None,
        "important_questions": None,
        "error": None
    }

    if not LANGGRAPH_AVAILABLE:
        # Fallback processing if LangGraph is not available
        s1 = analyze_intent(initial_state)
        s2 = extract_content(s1)
        s3 = generate_output(s2)
        s4 = format_response(s3)
        return dict(s4)

    try:
        # Build LangGraph workflow pipeline
        workflow = StateGraph(StudyState)

        workflow.add_node("analyze_intent", analyze_intent)
        workflow.add_node("extract_content", extract_content)
        workflow.add_node("generate_output", generate_output)
        workflow.add_node("format_response", format_response)

        workflow.set_entry_point("analyze_intent")
        workflow.add_edge("analyze_intent", "extract_content")
        workflow.add_edge("extract_content", "generate_output")
        workflow.add_edge("generate_output", "format_response")
        workflow.add_edge("format_response", END)

        app = workflow.compile()
        result = app.invoke(initial_state)
        return dict(result)
    except Exception as e:
        initial_state["error"] = str(e)
        return dict(initial_state)
