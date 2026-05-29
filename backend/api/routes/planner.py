"""Planner Routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services import planner_service

router = APIRouter()

class ScheduleRequest(BaseModel):
    tasks: List[str] = []
    deadlines: List[str] = []
    work_hours: int = 8
    preferences: dict = {}

class PrioritizeRequest(BaseModel):
    tasks: List[str]

class AddEventRequest(BaseModel):
    user_id: str = "default"
    title: str
    start_time: str
    end_time: str
    priority: str = "medium"
    event_type: str = "task"

@router.post("/generate")
async def generate_schedule(req: ScheduleRequest):
    schedule = planner_service.generate_schedule(req.tasks, req.deadlines, req.work_hours, req.preferences)
    return {"schedule": schedule, "tasks_count": len(req.tasks)}

@router.post("/prioritize")
async def prioritize_tasks(req: PrioritizeRequest):
    prioritized = planner_service.prioritize_tasks(req.tasks)
    return {"prioritized_tasks": prioritized}

@router.get("/today")
async def get_today_schedule(user_id: str = "default"):
    blocks = planner_service.get_today_blocks(user_id)
    return {"date": __import__("datetime").date.today().isoformat(), "blocks": blocks, "count": len(blocks)}

@router.post("/events")
async def add_event(req: AddEventRequest):
    event = planner_service.add_event(req.user_id, req.title, req.start_time, req.end_time, req.priority, req.event_type)
    return {"success": True, "event": event}

@router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    success = planner_service.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "deleted_id": event_id}
