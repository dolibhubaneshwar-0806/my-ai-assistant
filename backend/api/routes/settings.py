"""Settings Routes — Manages AI provider settings, custom alarm files, and full system backup exports"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import json
import shutil
from services.ai_router_service import load_user_settings, save_user_settings, MODEL_CATALOG
from services import memory_service, fitness_service, planner_service
from api.routes.chat import chat_histories

router = APIRouter()

# Directories for custom uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
AVATARS_DIR = os.path.join(UPLOAD_DIR, "avatars")
ALARMS_DIR = os.path.join(UPLOAD_DIR, "alarms")

# Ensure upload folders exist
os.makedirs(AVATARS_DIR, exist_ok=True)
os.makedirs(ALARMS_DIR, exist_ok=True)

class SettingsUpdateRequest(BaseModel):
    active_provider: Optional[str] = None
    active_model: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None
    theme_colors: Optional[Dict[str, str]] = None

class RemindersUpdateRequest(BaseModel):
    reminders: List[dict]

@router.get("")
async def get_settings():
    """Retrieve active system configuration."""
    settings = load_user_settings()
    # Mask API keys for safety before returning
    masked_settings = settings.copy()
    masked_keys = {}
    for provider, key in settings.get("api_keys", {}).items():
        if key and len(key) > 6:
            masked_keys[provider] = key[:3] + "..." + key[-3:]
        else:
            masked_keys[provider] = ""
    masked_settings["api_keys"] = masked_keys
    return masked_settings

@router.post("")
async def update_settings(req: SettingsUpdateRequest):
    """Save updated provider settings or theme styles."""
    settings = load_user_settings()
    
    if req.active_provider is not None:
        settings["active_provider"] = req.active_provider
    if req.active_model is not None:
        settings["active_model"] = req.active_model
    if req.theme_colors is not None:
        settings["theme_colors"] = req.theme_colors
        
    if req.api_keys is not None:
        # Merge updated keys, keeping previous if empty/masked values are submitted
        for provider, val in req.api_keys.items():
            if val and not val.endswith("..."):
                settings.setdefault("api_keys", {})[provider] = val

    save_user_settings(settings)
    return {"success": True, "settings": settings}

@router.get("/models")
async def get_models():
    """Return model list with cost, context, and speed metadata details."""
    return {"catalog": MODEL_CATALOG}

@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """Upload user avatar and return file serving path."""
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
        raise HTTPException(status_code=400, detail="Invalid image file format.")
        
    filename = f"avatar_{file.filename}"
    file_path = os.path.join(AVATARS_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        settings = load_user_settings()
        avatar_url = f"http://localhost:8000/static/avatars/{filename}"
        settings["profile_image"] = avatar_url
        save_user_settings(settings)
        
        # Also sync to memory profile
        memory_profile = memory_service.get_profile("default")
        memory_profile["avatar_url"] = avatar_url
        memory_service.update_profile("default", {"avatar_url": avatar_url})
        
        return {"success": True, "avatar_url": avatar_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@router.post("/upload-alarm")
async def upload_alarm(file: UploadFile = File(...)):
    """Save custom alarm sound track to static folder."""
    if not file.filename.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
        raise HTTPException(status_code=400, detail="Unsupported audio format.")
        
    file_path = os.path.join(ALARMS_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Register custom sound in list
        settings = load_user_settings()
        custom_sounds = settings.setdefault("custom_alarm_sounds", [])
        audio_url = f"http://localhost:8000/static/alarms/{file.filename}"
        if audio_url not in custom_sounds:
            custom_sounds.append({
                "name": file.filename.split(".")[0].replace("_", " ").title(),
                "url": audio_url
            })
            save_user_settings(settings)
            
        return {"success": True, "audio_url": audio_url, "sounds": settings["custom_alarm_sounds"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio upload failed: {str(e)}")

@router.get("/alarms")
async def list_alarms():
    """Retrieve list of all uploaded and default alarm audios."""
    settings = load_user_settings()
    custom_sounds = settings.get("custom_alarm_sounds", [])
    
    # Return default alert synth paths + custom audios
    default_sounds = [
        {"name": "Standard Alert Tone", "url": "http://localhost:8000/static/alarms/default_alert.mp3"},
        {"name": "Gentle Chimes", "url": "http://localhost:8000/static/alarms/gentle_chimes.mp3"},
        {"name": "Progressive Synth", "url": "http://localhost:8000/static/alarms/progressive_synth.mp3"}
    ]
    
    # Check if they exist on disk, else return placeholder references
    return {
        "defaults": default_sounds,
        "custom": custom_sounds
    }

@router.get("/export-all")
async def export_all_data(user_id: str = "default"):
    """Compile and export all logs, chats, and configurations in a single JSON backup."""
    profile = memory_service.get_profile(user_id)
    chat_log = chat_histories.get(user_id, [])
    fitness_summary = fitness_service.get_weekly_summary(user_id)
    settings = load_user_settings()
    
    # Bundle together
    backup_data = {
        "export_date": __import__("datetime").datetime.utcnow().isoformat(),
        "user_id": user_id,
        "profile": profile,
        "chat_history": chat_log,
        "fitness_summary": fitness_summary,
        "system_settings": {
            "active_provider": settings.get("active_provider"),
            "active_model": settings.get("active_model"),
            "theme_colors": settings.get("theme_colors"),
            "profile_image": settings.get("profile_image")
        }
    }
    return backup_data
