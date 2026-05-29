"""
AI LifeOS — FastAPI Backend Main Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from api.routes import study, fitness, planner, memory, chat, automation, settings
from scheduler.jobs import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="AI LifeOS API",
    description="Intelligent personal AI operating system backend — Study, Fitness, Planner, Memory & Automation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploaded Assets (Avatar Images & Alarm Sounds)
static_path = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_path, "avatars"), exist_ok=True)
os.makedirs(os.path.join(static_path, "alarms"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Register routes
app.include_router(study.router, prefix="/api/study", tags=["Study"])
app.include_router(fitness.router, prefix="/api/fitness", tags=["Fitness"])
app.include_router(planner.router, prefix="/api/planner", tags=["Planner"])
app.include_router(memory.router, prefix="/api/memory", tags=["Memory"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(automation.router, prefix="/api/automation", tags=["Automation"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "AI LifeOS API", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to AI LifeOS API",
        "docs": "/docs",
        "health": "/health",
    }
