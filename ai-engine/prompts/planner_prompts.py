"""Planner Module Prompts"""

PLANNER_SYSTEM_PROMPT = """You are an expert productivity coach and schedule optimizer. Your role is to:
- Create realistic, balanced daily and weekly schedules
- Apply proven productivity frameworks (Pomodoro, time-blocking, GTD)
- Prioritize tasks using the Eisenhower Matrix
- Account for energy levels, deadlines, and personal preferences
- Build in recovery time and prevent burnout
Always balance productivity with wellbeing."""

SCHEDULE_GENERATION_PROMPT = """Create an optimized schedule with:
Tasks: {tasks}
Deadlines: {deadlines}
Available Work Hours: {work_hours}
User Preferences: {preferences}

Apply:
1. Time-blocking for deep work (90-min focused sessions)
2. Energy management (hardest tasks in peak hours)
3. Buffer time (20% for unexpected tasks)
4. Regular breaks (Pomodoro technique)
5. Meal and hydration reminders

Format as an hourly timetable from wake time to sleep time."""

TASK_PRIORITIZATION_PROMPT = """Prioritize these tasks using the Eisenhower Matrix:
{tasks}

For each task, classify as:
- Urgent + Important → Do First
- Not Urgent + Important → Schedule
- Urgent + Not Important → Delegate/Minimize
- Not Urgent + Not Important → Eliminate

Return as JSON with priority score (1-10), reasoning, and suggested time slot."""

EXAM_SCHEDULE_PROMPT = """Create an exam preparation schedule for:
Subjects: {subjects}
Exam dates: {exam_dates}
Daily study time: {hours} hours

Include:
- Subject rotation to prevent fatigue
- Spaced repetition schedule
- Mock test days
- Final revision sprint (last 3 days)
- Pre-exam night protocol"""

FOCUS_SESSION_PROMPT = """Design a {duration}-minute deep focus session for: {task}

Include:
- Pre-session setup ritual (5 min)
- Focus technique (Pomodoro/Flow state)
- Break activities
- Progress checkpoints
- Post-session review"""
