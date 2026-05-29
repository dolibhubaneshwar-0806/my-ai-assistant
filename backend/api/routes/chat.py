"""Chat Routes — Streaming completions, history, pinning, exports & file-upload analysis"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json
import base64
import io
from datetime import datetime
from services.ai_router_service import ai_router
from services import memory_service

router = APIRouter()

# In-memory chat histories  { user_id: [ { id, role, content, timestamp, pinned } ] }
chat_histories: dict = {}


# ─── Pydantic models ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    user_id: str = "default"
    provider: Optional[str] = None   # override active provider per-request


class PinRequest(BaseModel):
    message_id: str
    user_id: str = "default"


# ─── Helper ───────────────────────────────────────────────────────────────────

def _build_context(user_id: str) -> str:
    profile = memory_service.get_profile(user_id)
    return (
        f"User habits: study {profile['habits'].get('study_hours_daily', 6)}h/day, "
        f"wake at {profile['habits'].get('wake_time', '6:30 AM')}, "
        f"goals: {[g['title'] for g in profile.get('goals', [])]}"
    )


# ─── Standard blocking chat ───────────────────────────────────────────────────

@router.post("")
async def chat(req: ChatMessage):
    """Standard blocking chat endpoint (backward-compatible)."""
    user_id = req.user_id
    history  = chat_histories.get(user_id, [])
    simple   = [{"role": m["role"], "content": m["content"]} for m in history]
    context  = _build_context(user_id)

    response_content = await ai_router.chat(req.message, simple, context)

    user_msg_id = str(uuid.uuid4())
    model_msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    history.append({"id": user_msg_id,  "role": "user",  "content": req.message,        "timestamp": now, "pinned": False})
    history.append({"id": model_msg_id, "role": "model", "content": response_content,   "timestamp": now, "pinned": False})
    chat_histories[user_id] = history[-100:]

    return {
        "response": response_content,
        "message_count": len(history),
        "user_message_id": user_msg_id,
        "model_message_id": model_msg_id,
    }


# ─── SSE Streaming chat ───────────────────────────────────────────────────────

@router.post("/stream")
async def chat_stream(req: ChatMessage):
    """Server-Sent Events streaming chat endpoint."""
    user_id = req.user_id
    history  = chat_histories.get(user_id, [])
    simple   = [{"role": m["role"], "content": m["content"]} for m in history]
    context  = _build_context(user_id)

    user_msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    history.append({"id": user_msg_id, "role": "user", "content": req.message, "timestamp": now, "pinned": False})
    chat_histories[user_id] = history

    async def event_generator():
        full_response = ""
        try:
            async for chunk in ai_router.chat_stream(req.message, simple, context):
                yield chunk
                if "data: " in chunk and "[DONE]" not in chunk:
                    try:
                        raw = chunk.replace("data: ", "").strip()
                        chunk_dict = json.loads(raw)
                        full_response += chunk_dict.get("content", "")
                    except Exception:
                        pass
        finally:
            model_msg = {
                "id": str(uuid.uuid4()),
                "role": "model",
                "content": full_response or "No response generated.",
                "timestamp": datetime.utcnow().isoformat(),
                "pinned": False,
            }
            history.append(model_msg)
            chat_histories[user_id] = history[-100:]

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ─── File Upload + Chat Endpoint ──────────────────────────────────────────────

@router.post("/upload-chat")
async def chat_with_files(
    message: str = Form(default="Please analyze the attached file(s)."),
    user_id: str = Form(default="default"),
    provider: Optional[str] = Form(default=None),
    files: List[UploadFile] = File(default=[]),
):
    """
    Multipart endpoint: accepts text message + one or more files (images/PDFs).
    Builds a rich context prompt and streams the AI response.
    Supports images via base64 vision (Gemini) and text extraction fallback.
    """
    history = chat_histories.get(user_id, [])
    simple  = [{"role": m["role"], "content": m["content"]} for m in history]
    context = _build_context(user_id)

    # ── Process uploaded files ─────────────────────────────────────────────
    file_context_parts: list[str] = []
    image_data_list: list[dict] = []   # for vision-capable models

    for upload in files:
        content_bytes = await upload.read()
        fname = upload.filename or "file"
        ftype = upload.content_type or ""

        if ftype.startswith("image/"):
            # Base64 encode image for vision context
            b64 = base64.b64encode(content_bytes).decode("utf-8")
            image_data_list.append({
                "name": fname,
                "mime_type": ftype,
                "base64": b64,
            })
            file_context_parts.append(f"[Image attached: {fname}]")

        elif ftype == "application/pdf" or fname.lower().endswith(".pdf"):
            # Basic PDF text extraction using PyMuPDF if available, else note attachment
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=io.BytesIO(content_bytes), filetype="pdf")
                pdf_text = ""
                for page_num in range(min(len(doc), 10)):   # max 10 pages
                    pdf_text += doc[page_num].get_text()
                doc.close()
                # Truncate to 6000 chars to stay within context limits
                truncated = pdf_text[:6000]
                file_context_parts.append(
                    f"[PDF: {fname}]\n```\n{truncated}\n```"
                    + ("...(truncated)" if len(pdf_text) > 6000 else "")
                )
            except ImportError:
                file_context_parts.append(f"[PDF attached: {fname} — install PyMuPDF for text extraction]")

        elif ftype.startswith("text/") or fname.endswith((".txt", ".md", ".csv")):
            try:
                text_content = content_bytes.decode("utf-8", errors="ignore")[:4000]
                file_context_parts.append(f"[Text file: {fname}]\n```\n{text_content}\n```")
            except Exception:
                file_context_parts.append(f"[File attached: {fname}]")
        else:
            file_context_parts.append(f"[File attached: {fname} ({ftype})]")

    # ── Build enriched prompt ──────────────────────────────────────────────
    enriched_message = message
    if file_context_parts:
        enriched_message = (
            "The user has attached the following file(s):\n\n"
            + "\n\n".join(file_context_parts)
            + f"\n\nUser message: {message}"
        )

    # Save user message to history
    user_msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    history.append({
        "id": user_msg_id,
        "role": "user",
        "content": message,
        "timestamp": now,
        "pinned": False,
        "has_attachments": True,
        "attachment_count": len(files),
    })
    chat_histories[user_id] = history

    # ── Stream response ────────────────────────────────────────────────────
    async def event_generator():
        full_response = ""
        try:
            async for chunk in ai_router.chat_stream(enriched_message, simple, context):
                yield chunk
                if "data: " in chunk and "[DONE]" not in chunk:
                    try:
                        raw = chunk.replace("data: ", "").strip()
                        chunk_dict = json.loads(raw)
                        full_response += chunk_dict.get("content", "")
                    except Exception:
                        pass
        finally:
            model_msg = {
                "id": str(uuid.uuid4()),
                "role": "model",
                "content": full_response or "I received your file(s) but could not generate a response.",
                "timestamp": datetime.utcnow().isoformat(),
                "pinned": False,
            }
            history.append(model_msg)
            chat_histories[user_id] = history[-100:]

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ─── History endpoints ─────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(user_id: str = "default"):
    """Get entire chat log."""
    history = chat_histories.get(user_id, [])
    if not history:
        welcome_id = str(uuid.uuid4())
        history = [{
            "id": welcome_id,
            "role": "model",
            "content": (
                "👋 Hey! I'm your **AI LifeOS assistant**.\n\n"
                "I'm connected and ready to help you with:\n"
                "• 📚 Study planning & note analysis\n"
                "• 🏋️ Fitness & nutrition guidance\n"
                "• 📋 Task & calendar management\n"
                "• 🖼️ Image & PDF analysis (tap the 📎 icon)\n\n"
                "What would you like to work on today?"
            ),
            "timestamp": datetime.utcnow().isoformat(),
            "pinned": False,
        }]
        chat_histories[user_id] = history
    return {"history": history, "count": len(history)}


@router.delete("/history")
async def clear_history(user_id: str = "default"):
    """Clear entire chat log."""
    chat_histories[user_id] = []
    return {"success": True, "message": "Chat history cleared"}


@router.get("/search")
async def search_history(query: str = Query(..., min_length=1), user_id: str = "default"):
    """Search for keyword in chat messages."""
    history = chat_histories.get(user_id, [])
    q = query.lower()
    matches = [m for m in history if q in m["content"].lower()]
    return {"query": query, "matches": matches, "count": len(matches)}


@router.post("/pin")
async def pin_message(req: PinRequest):
    """Pin or unpin a chat message by ID."""
    history = chat_histories.get(req.user_id, [])
    for msg in history:
        if msg["id"] == req.message_id:
            msg["pinned"] = not msg["pinned"]
            chat_histories[req.user_id] = history
            return {"success": True, "message_id": req.message_id, "pinned": msg["pinned"]}
    raise HTTPException(status_code=404, detail="Message not found")


@router.get("/export")
async def export_chat(user_id: str = "default", format: str = "json"):
    """Export history as text or JSON."""
    history = chat_histories.get(user_id, [])
    if format == "txt":
        lines = [f"AI LifeOS — Chat Export ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n" + "=" * 60 + "\n"]
        for m in history:
            label = "You" if m["role"] == "user" else "LifeOS AI"
            lines.append(f"[{m['timestamp'][:16]}] {label}:\n{m['content']}\n" + ("-" * 40) + "\n")
        return {"file_content": "\n".join(lines), "filename": "lifeos_chat.txt"}
    return {"history": history, "filename": "lifeos_chat.json"}
