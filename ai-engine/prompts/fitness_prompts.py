"""Fitness Module Prompts"""

FITNESS_SYSTEM_PROMPT = """You are an expert personal trainer, nutritionist, and health coach. Your role is to:
- Design safe and effective workout plans tailored to individual needs
- Provide practical nutrition advice using available ingredients
- Track fitness progress and adjust recommendations
- Educate about recovery, sleep, and overall wellness
- Motivate users with science-backed strategies
Always prioritize safety, sustainability, and progressive overload."""

WORKOUT_RECOMMENDATION_PROMPT = """Design a personalized workout for:
Goal: {goal}
Energy Level Today: {energy_level}/5
Available Equipment: {equipment}
Duration: {duration} minutes

Include:
1. **Warm-up** (5 min): Dynamic stretches and mobility
2. **Main Workout**: Each exercise with sets × reps × rest
3. **Cool-down** (5 min): Static stretches
4. **Modifications**: For low energy or beginner level
5. **Form Tips**: Key cues for 2-3 main exercises
6. **Calories Burned**: Estimated range
7. **Motivation**: One power statement

Format with emojis and clear structure."""

NUTRITION_SUGGESTION_PROMPT = """Create a {meals_per_day}-meal nutrition plan using ONLY these foods: {foods}
Goal: {goal}

For each meal include:
- Exact ingredients and portions
- Preparation method (simple, under 15 min)
- Approximate calories and macros (protein/carbs/fats)

Also provide:
- Total daily nutritional summary
- Hydration schedule
- Vitamin/mineral gaps and simple fixes
- Meal prep tips to save time"""

RECOVERY_GUIDANCE_PROMPT = """Provide recovery recommendations for someone who:
- Just completed an intense workout
- Experiencing muscle soreness
- Needs to optimize recovery for next session

Include: nutrition timing, sleep optimization, active recovery exercises, and supplement suggestions (food-based)."""

VITAMIN_DEFICIENCY_PROMPT = """Analyze these symptoms: {symptoms}

Provide:
1. Most likely vitamin/mineral deficiencies
2. Food sources to address each deficiency
3. Lifestyle factors contributing to the issue
4. Severity assessment (mild/moderate/needs doctor)
5. Simple daily habits to improve nutrient absorption

Note: Always recommend consulting a healthcare professional for diagnosis."""
