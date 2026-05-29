"""
AI Router Service — Multi-provider route dispatcher (Gemini, Groq, OpenRouter, Ollama)
Supports streaming, standard completions, and metadata retrieval.
"""

import os
import json
import httpx
from typing import AsyncGenerator, Dict, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "settings.json")

def load_user_settings() -> dict:
    """Load settings from local JSON file."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "active_provider": "gemini",
        "active_model": "models/gemini-1.5-flash",
        "api_keys": {
            "gemini": os.getenv("GEMINI_API_KEY", ""),
            "groq": os.getenv("GROQ_API_KEY", ""),
            "openrouter": os.getenv("OPENROUTER_API_KEY", ""),
            "ollama": "http://localhost:11434"
        },
        "theme_colors": {},
        "profile_image": ""
    }

def save_user_settings(settings: dict):
    """Save settings to local JSON file."""
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)

MODEL_CATALOG = {
    "gemini": [
        {
            "id": "models/gemini-1.5-flash",
            "name": "Gemini 1.5 Flash",
            "description": "Fast and lightweight model optimized for speed and efficiency.",
            "speed": "Fast (95/100)",
            "cost": "Very Low ($0.075 / 1M tokens)",
            "context": "1,048,576 tokens"
        },
        {
            "id": "models/gemini-1.5-pro",
            "name": "Gemini 1.5 Pro",
            "description": "Highly capable model for complex reasoning and multi-turn tasks.",
            "speed": "Moderate (65/100)",
            "cost": "Low ($1.25 / 1M tokens)",
            "context": "2,097,152 tokens"
        }
    ],
    "groq": [
        {
            "id": "llama3-8b-8192",
            "name": "Llama 3 8B (Groq)",
            "description": "Meta's highly optimized 8B model running on ultra-fast Groq LPUs.",
            "speed": "Blazing Fast (99/100)",
            "cost": "Free/Very Low",
            "context": "8,192 tokens"
        },
        {
            "id": "mixtral-8x7b-32768",
            "name": "Mixtral 8x7B (Groq)",
            "description": "High quality Mixture of Experts model for deep multi-step logic.",
            "speed": "Fast (80/100)",
            "cost": "Low",
            "context": "32,768 tokens"
        }
    ],
    "openrouter": [
        {
            "id": "meta-llama/llama-3-8b-instruct:free",
            "name": "Llama 3 8B Instruct (Free)",
            "description": "Free OpenRouter tier hosting Llama 3 8B.",
            "speed": "Moderate (70/100)",
            "cost": "Free ($0.00)",
            "context": "8,192 tokens"
        },
        {
            "id": "mistralai/mistral-7b-instruct:free",
            "name": "Mistral 7B Instruct (Free)",
            "description": "High performance 7B model by Mistral, hosted on OpenRouter's free tier.",
            "speed": "Moderate (70/100)",
            "cost": "Free ($0.00)",
            "context": "8,192 tokens"
        }
    ],
    "ollama": [
        {
            "id": "llama3",
            "name": "Llama 3 (Local Ollama)",
            "description": "Run Llama 3 locally on your machine. Fully private.",
            "speed": "Depends on local hardware",
            "cost": "Free (Local)",
            "context": "8,192 tokens"
        },
        {
            "id": "mistral",
            "name": "Mistral (Local Ollama)",
            "description": "Run Mistral 7B locally. Privacy-focused.",
            "speed": "Depends on local hardware",
            "cost": "Free (Local)",
            "context": "8,192 tokens"
        }
    ]
}

class AIRouterService:
    def __init__(self):
        pass

    def get_api_key(self, provider: str, settings: dict) -> str:
        """Get the API key from settings or environment variables fallback."""
        key = settings.get("api_keys", {}).get(provider, "")
        if not key:
            # Fallback to env variable
            key = os.getenv(f"{provider.upper()}_API_KEY", "")
        return key

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Unified blocking request to the active AI provider."""
        settings = load_user_settings()
        provider = settings.get("active_provider", "gemini")
        model_id = settings.get("active_model", "models/gemini-1.5-flash")
        api_key = self.get_api_key(provider, settings)

        system = system_prompt or "You are LifeOS AI, a helpful personal assistant."

        if provider == "gemini":
            try:
                if api_key:
                    genai.configure(api_key=api_key)
                # Fallback to models if required
                model = genai.GenerativeModel(model_id if model_id.startswith("models/") else f"models/{model_id}")
                full_prompt = f"{system}\n\n{prompt}"
                response = model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                return f"Gemini error: {str(e)}"

        # Rest of the providers route via OpenAI-compatible endpoints using httpx
        url = ""
        headers = {}
        payload = {}

        if provider == "groq":
            if not api_key:
                return "Error: Groq API Key is not set. Please set it in Settings."
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ]
            }

        elif provider == "openrouter":
            if not api_key:
                return "Error: OpenRouter API Key is not set. Please set it in Settings."
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI LifeOS"
            }
            payload = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ]
            }

        elif provider == "ollama":
            base_url = api_key or "http://localhost:11434"
            url = f"{base_url}/v1/chat/completions"
            headers = {
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ]
            }

        if url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                return f"Provider {provider} returned error: {str(e)}. Check your API key and connection."

        return "Error: Unknown provider selected."

    async def analyze_pdf(self, text: str, task: str = "summary") -> str:
        """Analyze PDF text using the active provider."""
        prompts = {
            "summary": f"Analyze the following document and provide a comprehensive, well-structured summary with key points, important concepts, and main takeaways:\n\n{text[:8000]}",
            "quiz": f"Generate 5 multiple-choice quiz questions from this content. Return as JSON array with fields: question, options (array of 4), answer. Content:\n\n{text[:6000]}",
            "important_questions": f"Predict 10 most likely exam questions from this content:\n\n{text[:8000]}",
        }
        prompt = prompts.get(task, prompts["summary"])
        return await self.generate_text(prompt, system_prompt="You are a brilliant study assistant. Review documents accurately.")

    async def chat(self, message: str, history: List[Dict[str, str]], system_context: str = "") -> str:
        """Retrieve full text response for chat."""
        # Wrap helper calls into generate_text
        prompt_with_history = ""
        for h in history[-10:]:
            role_name = "User" if h["role"] == "user" else "Assistant"
            prompt_with_history += f"{role_name}: {h['content']}\n"
        prompt_with_history += f"User: {message}\nAssistant: "

        system = (
            "You are LifeOS AI, an intelligent personal life assistant. "
            "You help users with study, fitness, planning, habits, and productivity. "
            "Be concise, friendly, and actionable. Use emojis appropriately.\n"
        )
        if system_context:
            system += f"\nUser Context:\n{system_context}"

        return await self.generate_text(prompt_with_history, system_prompt=system)

    async def chat_stream(self, message: str, history: List[Dict[str, str]], system_context: str = "") -> AsyncGenerator[str, None]:
        """Generate SSE streaming chunks for live AI typing responses."""
        settings = load_user_settings()
        provider = settings.get("active_provider", "gemini")
        model_id = settings.get("active_model", "models/gemini-1.5-flash")
        api_key = self.get_api_key(provider, settings)

        system = (
            "You are LifeOS AI, an intelligent personal life assistant. "
            "You help users with study, fitness, planning, habits, and productivity. "
            "Be concise, friendly, and actionable. Use emojis appropriately.\n"
        )
        if system_context:
            system += f"\nUser Context:\n{system_context}"

        # Setup messages payload in standard OpenAI format
        messages = [{"role": "system", "content": system}]
        for h in history[-10:]:
            role = "user" if h["role"] == "user" else "assistant"
            messages.append({"role": role, "content": h["content"]})
        messages.append({"role": "user", "content": message})

        # Gemini SDK has its own streaming mechanism
        if provider == "gemini":
            try:
                if api_key:
                    genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_id if model_id.startswith("models/") else f"models/{model_id}")
                
                # Format full prompt since standard gemini-chat works best with simple string concatenation or SDK chat history
                full_prompt = f"{system}\n\n"
                for msg in messages[1:]:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    full_prompt += f"{role}: {msg['content']}\n"
                full_prompt += "Assistant: "

                response = model.generate_content(full_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'content': chunk.text})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'content': f'Gemini streaming error: {str(e)}'})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Rest use standard Server Sent Events endpoint calling
        url = ""
        headers = {}
        payload = {}

        if provider == "groq":
            if not api_key:
                yield f"data: {json.dumps({'content': 'Error: Groq API Key is not set.'})}\n\n"
                yield "data: [DONE]\n\n"
                return
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "messages": messages,
                "stream": True
            }

        elif provider == "openrouter":
            if not api_key:
                yield f"data: {json.dumps({'content': 'Error: OpenRouter API Key is not set.'})}\n\n"
                yield "data: [DONE]\n\n"
                return
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI LifeOS"
            }
            payload = {
                "model": model_id,
                "messages": messages,
                "stream": True
            }

        elif provider == "ollama":
            base_url = api_key or "http://localhost:11434"
            url = f"{base_url}/v1/chat/completions"
            headers = {
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "messages": messages,
                "stream": True
            }

        if url:
            try:
                # Use client stream with POST
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            err_content = await response.aread()
                            yield f"data: {json.dumps({'content': f'API error ({response.status_code}): {err_content.decode()}'})}\n\n"
                            yield "data: [DONE]\n\n"
                            return

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    chunk_data = json.loads(data_str)
                                    text_chunk = chunk_data["choices"][0]["delta"].get("content", "")
                                    if text_chunk:
                                        yield f"data: {json.dumps({'content': text_chunk})}\n\n"
                                except Exception:
                                    pass
            except Exception as e:
                yield f"data: {json.dumps({'content': f'Stream request error: {str(e)}'})}\n\n"

        yield "data: [DONE]\n\n"

ai_router = AIRouterService()
