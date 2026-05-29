"""
Gemini Service Bridge — Routes calls dynamically to the active AI Router.
Ensures backward compatibility with existing synchronous services.
"""

import asyncio
import concurrent.futures
from typing import Optional
from services.ai_router_service import ai_router

def run_sync(coro):
    """Bridge synchronous callers to asynchronous services safely in FastAPI's loop."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    if loop.is_running():
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(asyncio.run, coro)
            return future.result()
    else:
        return loop.run_until_complete(coro)

class GeminiService:
    def __init__(self):
        self.configured = True

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        return run_sync(ai_router.generate_text(prompt, system_prompt))

    def analyze_pdf(self, text: str, task: str = "summary") -> str:
        return run_sync(ai_router.analyze_pdf(text, task))

    def chat(self, message: str, history: list = [], system_context: str = "") -> str:
        return run_sync(ai_router.chat(message, history, system_context))

# Maintain singleton instance for compatibility
gemini = GeminiService()
