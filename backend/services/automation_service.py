"""Automation Service — Rules engine for reminders and productivity workflows"""

from datetime import datetime
from typing import Optional

# Default automation rules
DEFAULT_RULES = [
    {
        "id": "rule_1",
        "name": "Hydration Reminder",
        "description": "Drink a glass of water",
        "trigger": "every_2_hours",
        "action": "send_notification",
        "action_config": {"message": "💧 Time to hydrate! Drink a glass of water.", "priority": "medium"},
        "enabled": True,
        "category": "health",
        "icon": "💧",
        "last_run": None,
        "run_count": 0,
    },
    {
        "id": "rule_2",
        "name": "Morning Study Alert",
        "description": "Start your study session",
        "trigger": "daily_9am",
        "action": "send_notification",
        "action_config": {"message": "📚 Good morning! Time to start your study session. You've got this!", "priority": "high"},
        "enabled": True,
        "category": "study",
        "icon": "📚",
        "last_run": None,
        "run_count": 0,
    },
    {
        "id": "rule_3",
        "name": "Sleep Schedule",
        "description": "Wind down for better sleep",
        "trigger": "daily_10pm",
        "action": "send_notification",
        "action_config": {"message": "😴 Time to wind down. Put away screens and prepare for sleep.", "priority": "high"},
        "enabled": True,
        "category": "health",
        "icon": "😴",
        "last_run": None,
        "run_count": 0,
    },
    {
        "id": "rule_4",
        "name": "Pomodoro Focus Session",
        "description": "25-min focused work, 5-min break",
        "trigger": "manual",
        "action": "start_timer",
        "action_config": {"duration_minutes": 25, "break_minutes": 5, "message": "🎯 Focus session started! No distractions for 25 minutes."},
        "enabled": True,
        "category": "productivity",
        "icon": "🎯",
        "last_run": None,
        "run_count": 0,
    },
    {
        "id": "rule_5",
        "name": "Workout Reminder",
        "description": "Time for your daily workout",
        "trigger": "daily_3:30pm",
        "action": "send_notification",
        "action_config": {"message": "🏋️ Workout time! A 30-min session will boost your energy and focus.", "priority": "medium"},
        "enabled": False,
        "category": "fitness",
        "icon": "🏋️",
        "last_run": None,
        "run_count": 0,
    },
    {
        "id": "rule_6",
        "name": "Evening Review",
        "description": "Review your day and plan tomorrow",
        "trigger": "daily_9pm",
        "action": "send_notification",
        "action_config": {"message": "📋 Daily review time! What did you accomplish today? Plan tomorrow.", "priority": "low"},
        "enabled": True,
        "category": "productivity",
        "icon": "📋",
        "last_run": None,
        "run_count": 0,
    },
]

# In-memory rule store
automation_rules = {r["id"]: r.copy() for r in DEFAULT_RULES}
rule_counter = len(DEFAULT_RULES)


def get_rules() -> list:
    return list(automation_rules.values())


def create_rule(name: str, trigger: str, action: str, action_config: dict, category: str = "general", icon: str = "⚡", description: str = "") -> dict:
    global rule_counter
    rule_counter += 1
    rule = {
        "id": f"rule_{rule_counter}",
        "name": name,
        "description": description,
        "trigger": trigger,
        "action": action,
        "action_config": action_config,
        "enabled": True,
        "category": category,
        "icon": icon,
        "last_run": None,
        "run_count": 0,
    }
    automation_rules[rule["id"]] = rule
    return rule


def update_rule(rule_id: str, updates: dict) -> Optional[dict]:
    if rule_id not in automation_rules:
        return None
    automation_rules[rule_id].update(updates)
    return automation_rules[rule_id]


def delete_rule(rule_id: str) -> bool:
    if rule_id in automation_rules:
        del automation_rules[rule_id]
        return True
    return False


def trigger_rule(rule_id: str) -> dict:
    """Manually execute a rule and return result."""
    if rule_id not in automation_rules:
        return {"success": False, "message": "Rule not found"}

    rule = automation_rules[rule_id]
    rule["last_run"] = datetime.utcnow().isoformat()
    rule["run_count"] = rule.get("run_count", 0) + 1

    action = rule.get("action", "")
    config = rule.get("action_config", {})

    result = {
        "success": True,
        "rule_id": rule_id,
        "rule_name": rule["name"],
        "action": action,
        "message": config.get("message", f"Rule '{rule['name']}' executed successfully"),
        "executed_at": rule["last_run"],
    }

    if action == "start_timer":
        result["timer"] = {
            "duration_minutes": config.get("duration_minutes", 25),
            "break_minutes": config.get("break_minutes", 5),
        }

    return result
