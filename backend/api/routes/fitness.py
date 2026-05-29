"""Fitness Routes"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services import fitness_service

router = APIRouter()

class WorkoutRequest(BaseModel):
    goal: str = "general fitness"
    energy_level: int = 3
    equipment: List[str] = []
    duration_minutes: int = 45

class NutritionRequest(BaseModel):
    available_foods: List[str] = []
    goal: str = "balanced nutrition"
    meals_per_day: int = 3

class FitnessLogRequest(BaseModel):
    user_id: str = "default"
    entry_type: str  # workout | meal | sleep
    data: dict

class VitaminRequest(BaseModel):
    symptoms: List[str] = ["fatigue", "low energy"]

@router.post("/recommend")
async def recommend_workout(req: WorkoutRequest):
    recommendation = fitness_service.recommend_workout(req.goal, req.energy_level, req.equipment, req.duration_minutes)
    return {"goal": req.goal, "energy_level": req.energy_level, "recommendation": recommendation}

@router.post("/food")
async def nutrition_suggestions(req: NutritionRequest):
    plan = fitness_service.suggest_nutrition(req.available_foods, req.goal, req.meals_per_day)
    return {"goal": req.goal, "available_foods": req.available_foods, "nutrition_plan": plan}

@router.post("/log")
async def log_fitness(req: FitnessLogRequest):
    entry = fitness_service.log_fitness_entry(req.user_id, req.entry_type, req.data)
    return {"success": True, "entry": entry}

@router.get("/summary")
async def weekly_summary(user_id: str = "default"):
    return fitness_service.get_weekly_summary(user_id)

@router.post("/vitamins")
async def vitamin_guidance(req: VitaminRequest):
    guidance = fitness_service.get_vitamin_guidance(req.symptoms)
    return {"symptoms": req.symptoms, "guidance": guidance}
