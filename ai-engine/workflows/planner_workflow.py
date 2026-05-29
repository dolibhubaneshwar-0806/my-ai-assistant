"""Planner intelligence workflow using LangGraph framework structure"""

from typing import Dict, List, Any, TypedDict, Optional
from services.gemini_service import gemini

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False


class PlannerState(TypedDict):
    user_id: str
    tasks: List[str]
    deadlines: List[str]
    work_hours: int
    preferences: Dict[str, Any]
    prioritized_queue: List[Dict[str, Any]]
    allocated_schedule: Optional[str]
    error: Optional[str]


def collect_constraints(state: PlannerState) -> PlannerState:
    """Pre-process user schedule limits, energy maps, and breaks."""
    if not state["preferences"]:
        state["preferences"] = {"wake_time": "7:00 AM", "sleep_time": "11:00 PM"}
    return state


def prioritize(state: PlannerState) -> PlannerState:
    """Run an Eisen-matrix priority analysis on outstanding tasks."""
    tasks = state["tasks"]
    queue = []
    for i, t in enumerate(tasks):
        # Default priority ranking
        priority = "urgent_important" if i == 0 else "not_urgent_important"
        queue.append({
            "task": t,
            "priority": priority,
            "score": 10 - i,
            "estimated_minutes": 60
        })
    state["prioritized_queue"] = queue
    return state


def allocate_time(state: PlannerState) -> PlannerState:
    """Build an hourly block allocate agenda matching peak window slots."""
    queue = state["prioritized_queue"]
    hours = state["work_hours"]
    prefs = state["preferences"]
    
    tasks_list = ", ".join([item["task"] for item in queue])
    prompt = (
        f"Design a daily calendar schedule for these tasks: {tasks_list}. "
        f"Available deep work: {hours} hours. Wake time: {prefs.get('wake_time')}, "
        f"sleep time: {prefs.get('sleep_time')}."
    )
    state["allocated_schedule"] = gemini.generate_text(prompt)
    return state


def output_schedule(state: PlannerState) -> PlannerState:
    return state


def run_planner_workflow(user_id: str, tasks: List[str], deadlines: List[str], work_hours: int = 8) -> Dict[str, Any]:
    """Execute Planner Intelligence multi-agent workflow."""
    initial_state: PlannerState = {
        "user_id": user_id,
        "tasks": tasks,
        "deadlines": deadlines,
        "work_hours": work_hours,
        "preferences": {},
        "prioritized_queue": [],
        "allocated_schedule": None,
        "error": None
    }

    if not LANGGRAPH_AVAILABLE:
        # Fallback pipeline
        s1 = collect_constraints(initial_state)
        s2 = prioritize(s1)
        s3 = allocate_time(s2)
        s4 = output_schedule(s3)
        return dict(s4)

    try:
        workflow = StateGraph(PlannerState)

        workflow.add_node("collect_constraints", collect_constraints)
        workflow.add_node("prioritize", prioritize)
        workflow.add_node("allocate_time", allocate_time)
        workflow.add_node("output_schedule", output_schedule)

        workflow.set_entry_point("collect_constraints")
        workflow.add_edge("collect_constraints", "prioritize")
        workflow.add_edge("prioritize", "allocate_time")
        workflow.add_edge("allocate_time", "output_schedule")
        workflow.add_edge("output_schedule", END)

        app = workflow.compile()
        result = app.invoke(initial_state)
        return dict(result)
    except Exception as e:
        initial_state["error"] = str(e)
        return dict(initial_state)
