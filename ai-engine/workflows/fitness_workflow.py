"""Fitness intelligence workflow using LangGraph framework structure"""

from typing import Dict, List, Any, TypedDict, Optional
from services.gemini_service import gemini

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False


class FitnessState(TypedDict):
    user_id: str
    goal: str
    energy_level: int
    equipment: List[str]
    duration_minutes: int
    symptoms: List[str]
    workout_plan: Optional[str]
    nutrition_plan: Optional[str]
    safety_flags: List[str]
    error: Optional[str]


def assess_user_state(state: FitnessState) -> FitnessState:
    """Analyze active safety markers, injury histories, or flags."""
    flags = []
    if state["energy_level"] <= 2:
        flags.append("Low energy mode activated: Suggesting low impact or active recovery.")
    if any(s in [sym.lower() for sym in state["symptoms"]] for s in ["joint pain", "injury", "chest pain"]):
        flags.append("Warning: Consult a physical doctor. Limiting impact or high resistance.")
    state["safety_flags"] = flags
    return state


def generate_plan(state: FitnessState) -> FitnessState:
    """Build tailored exercise suggestions and hydration rules."""
    goal = state["goal"]
    energy = state["energy_level"]
    equip = ", ".join(state["equipment"]) if state["equipment"] else "none"
    duration = state["duration_minutes"]
    
    prompt = (
        f"Create a workout plan for goal: {goal}, available equipment: {equip}, "
        f"duration: {duration} mins, energy level: {energy}/5."
    )
    if state["safety_flags"]:
        prompt += f"\nSafety notes to respect: {state['safety_flags']}"
        
    state["workout_plan"] = gemini.generate_text(prompt)
    
    # Nutrition suggestion
    nutrition_prompt = f"Design daily nutrition tips for goal: {goal}. User is feeling energy level {energy}/5."
    state["nutrition_plan"] = gemini.generate_text(nutrition_prompt)
    
    return state


def add_safety_checks(state: FitnessState) -> FitnessState:
    """Inject safety warnings or warm-up constraints."""
    if state["safety_flags"] and state["workout_plan"]:
        warnings = "\n\n⚠️ **Safety Advisory**:\n" + "\n".join([f"- {f}" for f in state["safety_flags"]])
        state["workout_plan"] += warnings
    return state


def format_output(state: FitnessState) -> FitnessState:
    return state


def run_fitness_workflow(user_id: str, goal: str, energy_level: int, equipment: List[str], symptoms: List[str]) -> Dict[str, Any]:
    """Execute Fitness Intelligence multi-agent workflow."""
    initial_state: FitnessState = {
        "user_id": user_id,
        "goal": goal,
        "energy_level": energy_level,
        "equipment": equipment,
        "duration_minutes": 45,
        "symptoms": symptoms,
        "workout_plan": None,
        "nutrition_plan": None,
        "safety_flags": [],
        "error": None
    }

    if not LANGGRAPH_AVAILABLE:
        # Fallback pipeline
        s1 = assess_user_state(initial_state)
        s2 = generate_plan(s1)
        s3 = add_safety_checks(s2)
        s4 = format_output(s3)
        return dict(s4)

    try:
        workflow = StateGraph(FitnessState)

        workflow.add_node("assess_user_state", assess_user_state)
        workflow.add_node("generate_plan", generate_plan)
        workflow.add_node("add_safety_checks", add_safety_checks)
        workflow.add_node("format_output", format_output)

        workflow.set_entry_point("assess_user_state")
        workflow.add_edge("assess_user_state", "generate_plan")
        workflow.add_edge("generate_plan", "add_safety_checks")
        workflow.add_edge("add_safety_checks", "format_output")
        workflow.add_edge("format_output", END)

        app = workflow.compile()
        result = app.invoke(initial_state)
        return dict(result)
    except Exception as e:
        initial_state["error"] = str(e)
        return dict(initial_state)
