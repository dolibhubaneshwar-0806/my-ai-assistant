"""Memory Service — User profile, habits, goals, and AI insights"""

from datetime import datetime
from services.gemini_service import gemini

# In-memory profile store (replace with Supabase in production)
memory_store = {}

DEFAULT_PROFILE = {
    "habits": {
        "wake_time": "6:30 AM",
        "sleep_time": "11:00 PM",
        "study_hours_daily": 6,
        "workout_days_per_week": 4,
        "hydration_glasses": 8,
        "screen_time_limit": 3,
    },
    "goals": [
        {"id": "g1", "title": "Score 90%+ in exams", "category": "study", "progress": 65, "deadline": "2025-12-31"},
        {"id": "g2", "title": "Lose 5 kg", "category": "fitness", "progress": 40, "deadline": "2025-09-30"},
        {"id": "g3", "title": "Build consistent morning routine", "category": "productivity", "progress": 80, "deadline": "2025-08-01"},
    ],
    "preferences": {
        "study_style": "pomodoro",
        "workout_type": "home_bodyweight",
        "diet": "vegetarian",
        "notification_frequency": "medium",
        "theme": "dark",
        "language": "english",
    },
    "weak_subjects": ["Mathematics", "Physics"],
    "productivity_patterns": {
        "peak_hours": ["7 AM - 10 AM", "8 PM - 10 PM"],
        "low_energy_times": ["2 PM - 4 PM"],
        "average_focus_minutes": 45,
    },
    "streak_data": {
        "study_streak": 5,
        "workout_streak": 3,
        "hydration_streak": 2,
        "longest_streak": 12,
    },
    "habit_logs": [],
    "updated_at": datetime.utcnow().isoformat(),
}


def get_profile(user_id: str = "default") -> dict:
    """Fetch user memory profile, creating default if none exists."""
    if user_id not in memory_store:
        memory_store[user_id] = DEFAULT_PROFILE.copy()
    return memory_store[user_id]


def update_profile(user_id: str, data: dict) -> dict:
    """Update specific fields in user memory profile."""
    profile = get_profile(user_id)
    for key, value in data.items():
        if key in profile and isinstance(profile[key], dict) and isinstance(value, dict):
            profile[key].update(value)
        else:
            profile[key] = value
    profile["updated_at"] = datetime.utcnow().isoformat()
    memory_store[user_id] = profile
    return profile


def log_habit(user_id: str, habit: str, value, notes: str = "") -> dict:
    """Append a habit log entry."""
    profile = get_profile(user_id)
    entry = {
        "habit": habit,
        "value": value,
        "notes": notes,
        "timestamp": datetime.utcnow().isoformat(),
    }
    profile["habit_logs"].append(entry)
    memory_store[user_id] = profile
    return entry


def get_insights(user_id: str = "default") -> str:
    """Generate AI insights from user habit patterns."""
    profile = get_profile(user_id)
    recent_logs = profile.get("habit_logs", [])[-30:]
    habits = profile.get("habits", {})
    streaks = profile.get("streak_data", {})
    goals = profile.get("goals", [])

    context = (
        f"User habits: {habits}\n"
        f"Current streaks: {streaks}\n"
        f"Goals: {[g['title'] for g in goals]}\n"
        f"Recent habit logs ({len(recent_logs)} entries): {recent_logs[:5]}"
    )

    prompt = (
        f"Based on this user's data:\n{context}\n\n"
        "Provide personalized insights including:\n"
        "1. Positive patterns to reinforce\n"
        "2. Areas that need improvement\n"
        "3. Specific actionable recommendations for this week\n"
        "4. Motivation based on their streaks and goals\n\n"
        "Be encouraging, specific, and use data from their logs. Use emojis."
    )
    return gemini.generate_text(prompt)


def get_all_users() -> list:
    return list(memory_store.keys())
