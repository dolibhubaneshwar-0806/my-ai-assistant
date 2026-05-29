"""Fitness Service — Workout recommendations, nutrition suggestions, health tracking"""

from datetime import datetime
from services.gemini_service import gemini

# In-memory fitness log store
fitness_logs = []


def recommend_workout(goal: str, energy_level: int, equipment: list, duration_minutes: int = 45) -> str:
    """Generate personalized workout recommendation."""
    equipment_str = ", ".join(equipment) if equipment else "no equipment (bodyweight only)"
    energy_map = {1: "very low", 2: "low", 3: "moderate", 4: "high", 5: "very high"}
    energy_label = energy_map.get(energy_level, "moderate")

    prompt = (
        f"Design a {duration_minutes}-minute workout for someone with these specs:\n"
        f"- Goal: {goal}\n"
        f"- Energy level today: {energy_label} ({energy_level}/5)\n"
        f"- Available equipment: {equipment_str}\n\n"
        "Include:\n"
        "1. Warm-up (5 min)\n"
        "2. Main workout with sets/reps/duration for each exercise\n"
        "3. Cool-down (5 min)\n"
        "4. Rest periods between exercises\n"
        "5. Modifications if energy is low\n"
        "6. Motivational tip\n\n"
        "Format clearly with emojis and easy-to-follow structure."
    )
    return gemini.generate_text(prompt)


def suggest_nutrition(available_foods: list, goal: str, meals_per_day: int = 3) -> str:
    """Generate nutrition plan from available home foods."""
    foods_str = ", ".join(available_foods) if available_foods else "rice, dal, vegetables, eggs, milk"
    prompt = (
        f"Create a {meals_per_day}-meal nutrition plan using ONLY these available foods: {foods_str}\n"
        f"Goal: {goal}\n\n"
        "Include:\n"
        "1. Meal plan for the day (breakfast, lunch, dinner, snacks)\n"
        "2. Approximate calories per meal\n"
        "3. Protein/carb/fat breakdown\n"
        "4. Hydration recommendations\n"
        "5. Any vitamin/mineral gaps and simple fixes\n"
        "6. Meal prep tips\n\n"
        "Be practical and use common Indian home cooking methods."
    )
    return gemini.generate_text(prompt)


def log_fitness_entry(user_id: str, entry_type: str, data: dict) -> dict:
    """Log workout, meal, or sleep entry."""
    entry = {
        "id": f"log_{len(fitness_logs) + 1}",
        "user_id": user_id,
        "type": entry_type,  # workout | meal | sleep
        "data": data,
        "date": datetime.utcnow().isoformat(),
    }
    fitness_logs.append(entry)
    return entry


def get_weekly_summary(user_id: str = "default") -> dict:
    """Get weekly fitness summary with AI insights."""
    user_logs = [l for l in fitness_logs if l.get("user_id") == user_id]
    workouts = [l for l in user_logs if l["type"] == "workout"]
    meals = [l for l in user_logs if l["type"] == "meal"]
    sleep_logs = [l for l in user_logs if l["type"] == "sleep"]

    return {
        "total_workouts": len(workouts),
        "total_meals_logged": len(meals),
        "sleep_entries": len(sleep_logs),
        "streak_days": min(len(workouts), 7),
        "fitness_score": min(100, len(workouts) * 15 + len(meals) * 5 + len(sleep_logs) * 10),
        "insights": (
            f"You've completed {len(workouts)} workouts this week. "
            "Keep pushing — consistency is key! 💪"
            if workouts else
            "No workouts logged yet this week. Start with a 20-minute session today! 🏃"
        ),
        "recommendations": [
            "Aim for 150 minutes of moderate exercise per week",
            "Log your meals to track nutritional balance",
            "Prioritize 7-9 hours of sleep for recovery",
        ]
    }


def get_vitamin_guidance(symptoms: list) -> str:
    """Get vitamin deficiency awareness based on symptoms."""
    symptoms_str = ", ".join(symptoms) if symptoms else "fatigue, low energy"
    prompt = (
        f"Based on these symptoms: {symptoms_str}\n\n"
        "Provide:\n"
        "1. Possible vitamin/mineral deficiencies\n"
        "2. Food sources rich in each nutrient\n"
        "3. Lifestyle adjustments\n"
        "4. When to consult a doctor\n\n"
        "Note: This is informational only, not medical advice."
    )
    return gemini.generate_text(prompt)
