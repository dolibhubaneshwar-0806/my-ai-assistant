"""Automation Routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import automation_service

router = APIRouter()

class CreateRuleRequest(BaseModel):
    name: str
    trigger: str
    action: str
    action_config: dict = {}
    category: str = "general"
    icon: str = "⚡"
    description: str = ""

class UpdateRuleRequest(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    trigger: Optional[str] = None
    action_config: Optional[dict] = None

@router.get("/rules")
async def get_rules():
    rules = automation_service.get_rules()
    return {"rules": rules, "count": len(rules)}

@router.post("/rules")
async def create_rule(req: CreateRuleRequest):
    rule = automation_service.create_rule(req.name, req.trigger, req.action, req.action_config, req.category, req.icon, req.description)
    return {"success": True, "rule": rule}

@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, req: UpdateRuleRequest):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    rule = automation_service.update_rule(rule_id, updates)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"success": True, "rule": rule}

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    success = automation_service.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"success": True, "deleted_id": rule_id}

@router.post("/trigger")
async def trigger_rule(rule_id: str):
    result = automation_service.trigger_rule(rule_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message", "Rule not found"))
    return result
