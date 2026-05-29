"""Planner Service — AI schedule generation, task prioritization, time-block management"""

from datetime import datetime, date, timedelta
from typing import Optional
from services.gemini_service import gemini

# In-memory event store
planner_events = []


def generate_schedule(tasks: list, deadlines: list, work_hours: int = 8, preferences: dict = {}) -> str:
    """Generate AI-powered daily/weekly schedule."""
    tasks_str = "\n".join([f"- {t}" for t in tasks]) if tasks else "- General study and productivity"
    deadlines_str = "\n".join([f"- {d}" for d in deadlines]) if deadlines else "- No specific deadlines"
    wake_time = preferences.get("wake_time", "6:00 AM")
    sleep_time = preferences.get("sleep_time", "11:00 PM")

    prompt = (
        f"Create an optimized daily schedule with these parameters:\n"
        f"Tasks:\n{tasks_str}\n\n"
        f"Deadlines:\n{deadlines_str}\n\n"
        f"Available work hours: {work_hours} hours\n"
        f"Wake time: {wake_time}, Sleep time: {sleep_time}\n\n"
        "Include:\n"
        "1. Hourly time blocks with specific tasks\n"
        "2. Break periods (Pomodoro-style)\n"
        "3. Meal and hydration reminders\n"
        "4. Priority ordering (high → low)\n"
        "5. Evening review and next-day prep\n\n"
        "Format as a clear, visual time-table with emojis."
    )
    return gemini.generate_text(prompt)


def prioritize_tasks(tasks: list) -> list:
    """AI-based task prioritization (Eisenhower Matrix)."""
    if not tasks:
        return []

    prompt = (
        f"Categorize and prioritize these tasks using the Eisenhower Matrix:\n"
        + "\n".join([f"- {t}" for t in tasks])
        + "\n\nReturn as JSON: "
        + '[{"task": "...", "priority": "urgent_important|not_urgent_important|urgent_not_important|not_urgent_not_important", "score": 1-10, "reason": "..."}]'
    )
    try:
        import json
        result = gemini.generate_text(prompt)
        start = result.find("[")
        end = result.rfind("]") + 1
        if start != -1 and end > start:
            return json.loads(result[start:end])
    except Exception:
        pass

    # Fallback: numbered priority
    return [{"task": t, "priority": "urgent_important", "score": 10 - i, "reason": "Added to queue"} for i, t in enumerate(tasks)]


def get_today_blocks(user_id: str = "default") -> list:
    """Get time-block events for today."""
    today = date.today().isoformat()
    user_events = [e for e in planner_events if e.get("user_id") == user_id]
    today_events = [e for e in user_events if e.get("date", "").startswith(today)]

    if not today_events:
        # Return default demo schedule
        base = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        return [
            {"id": "demo_1", "title": "Morning Routine", "start": "06:00", "end": "07:00", "type": "routine", "color": "#6366f1"},
            {"id": "demo_2", "title": "Study Block 1", "start": "07:00", "end": "09:00", "type": "study", "color": "#8b5cf6"},
            {"id": "demo_3", "title": "Breakfast Break", "start": "09:00", "end": "09:30", "type": "break", "color": "#22c55e"},
            {"id": "demo_4", "title": "Study Block 2", "start": "09:30", "end": "12:00", "type": "study", "color": "#8b5cf6"},
            {"id": "demo_5", "title": "Lunch + Rest", "start": "12:00", "end": "13:00", "type": "break", "color": "#22c55e"},
            {"id": "demo_6", "title": "Study Block 3", "start": "13:00", "end": "15:00", "type": "study", "color": "#8b5cf6"},
            {"id": "demo_7", "title": "Workout", "start": "15:30", "end": "16:30", "type": "fitness", "color": "#f59e0b"},
            {"id": "demo_8", "title": "Evening Study", "start": "17:00", "end": "19:00", "type": "study", "color": "#8b5cf6"},
            {"id": "demo_9", "title": "Dinner", "start": "19:00", "end": "20:00", "type": "break", "color": "#22c55e"},
            {"id": "demo_10", "title": "Review + Planning", "start": "20:00", "end": "21:00", "type": "routine", "color": "#6366f1"},
            {"id": "demo_11", "title": "Wind Down", "start": "22:00", "end": "23:00", "type": "routine", "color": "#6366f1"},
        ]
    return today_events


def add_event(user_id: str, title: str, start_time: str, end_time: str, priority: str = "medium", event_type: str = "task") -> dict:
    """Add a new event to the planner."""
    event = {
        "id": f"event_{len(planner_events) + 1}",
        "user_id": user_id,
        "title": title,
        "start": start_time,
        "end": end_time,
        "priority": priority,
        "type": event_type,
        "completed": False,
        "date": datetime.utcnow().date().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
    }
    planner_events.append(event)
    return event


def delete_event(event_id: str) -> bool:
    """Remove an event from the planner."""
    global planner_events
    before = len(planner_events)
    planner_events = [e for e in planner_events if e["id"] != event_id]
    return len(planner_events) < before
