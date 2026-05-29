"""Memory Routes"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from services import memory_service

router = APIRouter()

class UpdateProfileRequest(BaseModel):
    user_id: str = "default"
    data: dict

class HabitLogRequest(BaseModel):
    user_id: str = "default"
    habit: str
    value: Any
    notes: str = ""

@router.get("/profile")
async def get_profile(user_id: str = "default"):
    profile = memory_service.get_profile(user_id)
    return {"user_id": user_id, "profile": profile}

@router.post("/update")
async def update_profile(req: UpdateProfileRequest):
    updated = memory_service.update_profile(req.user_id, req.data)
    return {"success": True, "profile": updated}

@router.post("/habit")
async def log_habit(req: HabitLogRequest):
    entry = memory_service.log_habit(req.user_id, req.habit, req.value, req.notes)
    return {"success": True, "entry": entry}

@router.get("/insights")
async def get_insights(user_id: str = "default"):
    insights = memory_service.get_insights(user_id)
    return {"user_id": user_id, "insights": insights}
