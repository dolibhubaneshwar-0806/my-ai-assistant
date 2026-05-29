"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  Mic,
  Volume2,
  VolumeX,
  Search,
  Pin,
  Download,
  X,
  FileText,
  FileCode,
  Paperclip,
  Image as ImageIcon,
  File,
  ChevronDown,
  Sparkles,
  Zap,
  Globe,
  Cpu,
  Settings2,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/components/ToastProvider";

const API_BASE = "http://localhost:8000/api";

// ─── AI Provider Config ───────────────────────────────────────────────────────

const PROVIDERS = [
  { id: "gemini",     label: "Gemini",     emoji: "✨", icon: Sparkles,  color: "#4285f4" },
  { id: "groq",       label: "Groq",       emoji: "⚡", icon: Zap,       color: "#f55036" },
  { id: "openrouter", label: "OpenRouter", emoji: "🌐", icon: Globe,     color: "#8b5cf6" },
  { id: "ollama",     label: "Ollama",     emoji: "💻", icon: Cpu,       color: "#10b981" },
];

// ─── Quick Suggestion Prompts ─────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "📋 Review my tasks",
  "🏋️ Suggest a workout",
  "📚 Study tips for today",
  "💧 Hydration reminder",
  "🎯 Help me focus",
  "📊 Weekly progress?",
];

// ─── File Attachment Type ──────────────────────────────────────────────────────

interface Attachment {
  file: File;
  preview?: string; // data URL for images
  type: "image" | "pdf" | "other";
  name: string;
  size: string;
}

// ─── Message Type ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  pinned: boolean;
  attachments?: { name: string; type: string; url?: string }[];
}

// ─── Utility: format file size ────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ═════════════════════════════════════════════════════════════════════════════
// Chat Page Component
// ═════════════════════════════════════════════════════════════════════════════

export default function ChatPage() {
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Provider selection
  const [activeProvider, setActiveProvider] = useState("gemini");
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // File attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchHistory();
    setupSpeechRecognition();
    loadSavedProvider();

    // Request notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            showToast({
              type: "success",
              title: "Notifications Enabled",
              message: "You'll receive AI suggestions & reminders.",
              duration: 4000,
            });
          }
        });
      }
    }

    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close provider menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const triggerHaptic = (duration = 10) => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const loadSavedProvider = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      if (res.data.active_provider) setActiveProvider(res.data.active_provider);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat/history`);
      setMessages(res.data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Speech Recognition ────────────────────────────────────────────────────
  const setupSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onstart = () => { setIsListening(true); triggerHaptic(20); };
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputValue((prev) => (prev ? prev + " " + text : text));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => { setIsListening(false); triggerHaptic(15); };
    recognitionRef.current = rec;
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast({ type: "error", title: "Voice Not Supported", message: "Try Chrome or Edge.", duration: 4000 });
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const handleSpeak = (text: string, msgId: string) => {
    triggerHaptic(15);
    if (typeof window === "undefined") return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`~]/g, "");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.onend = () => setSpeakingMsgId(null);
    utt.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utt);
  };

  // ── File Attachment ───────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments: Attachment[] = [];
    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const att: Attachment = {
        file,
        name: file.name,
        size: formatBytes(file.size),
        type: isImage ? "image" : isPdf ? "pdf" : "other",
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          att.preview = ev.target?.result as string;
          setAttachments((prev) =>
            prev.map((a) => (a.name === att.name ? { ...a, preview: att.preview } : a))
          );
        };
        reader.readAsDataURL(file);
      }
      newAttachments.push(att);
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    showToast({
      type: "info",
      title: `${files.length} File${files.length > 1 ? "s" : ""} Attached`,
      message: files.map((f) => f.name).join(", "),
      duration: 3500,
    });
    // Reset input so same file can be re-added
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  // ── Provider Switch ───────────────────────────────────────────────────────
  const switchProvider = async (providerId: string) => {
    setActiveProvider(providerId);
    setShowProviderMenu(false);
    triggerHaptic(15);
    const provLabel = PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId;
    showToast({
      type: "success",
      title: "Provider Switched",
      message: `Now using ${provLabel}`,
      duration: 3000,
    });
    try {
      await axios.post(`${API_BASE}/settings`, { active_provider: providerId });
    } catch {}
  };

  // ── Send Message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent | null, overrideText?: string) => {
    if (e) e.preventDefault();
    const msgText = overrideText ?? inputValue;
    if (!msgText.trim() && attachments.length === 0) return;
    if (loading) return;

    const userMsg = msgText;
    setInputValue("");
    setLoading(true);
    triggerHaptic(20);

    // Build FormData if we have attachments, else use JSON
    const hasFiles = attachments.length > 0;
    const currentAttachments = [...attachments];
    setAttachments([]);

    // Build user message for display
    const tempUserMsgId = "user_temp_" + Date.now();
    const userDisplayMsg: Message = {
      id: tempUserMsgId,
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
      pinned: false,
      attachments: currentAttachments.map((a) => ({
        name: a.name,
        type: a.type,
        url: a.preview,
      })),
    };
    setMessages((prev) => [...prev, userDisplayMsg]);

    try {
      let response: Response;

      if (hasFiles) {
        // Use multipart/form-data for file upload
        const formData = new FormData();
        formData.append("message", userMsg || "Please analyze the attached file(s).");
        formData.append("provider", activeProvider);
        currentAttachments.forEach((a) => formData.append("files", a.file));

        response = await fetch(`${API_BASE}/chat/upload-chat`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg, provider: activeProvider }),
        });
      }

      if (!response.body) throw new Error("Null response stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantText = "";

      // Push empty assistant bubble
      const tempModelMsgId = "model_temp_" + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: tempModelMsgId,
          role: "model",
          content: "",
          timestamp: new Date().toISOString(),
          pinned: false,
        },
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (done) break;

        const rawText = decoder.decode(value);
        const lines = rawText.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(dataStr);
              assistantText += parsed.content ?? "";
              setMessages((prev) => {
                const list = [...prev];
                const last = list.length - 1;
                if (list[last]?.role === "model") {
                  list[last] = { ...list[last], content: assistantText };
                }
                return list;
              });
            } catch {}
          }
        }
      }

      fetchHistory();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          role: "model",
          content:
            "⚠️ **Connection Error:** Could not reach the AI backend. Make sure the FastAPI server is running on port 8000.",
          timestamp: new Date().toISOString(),
          pinned: false,
        },
      ]);
      showToast({
        type: "error",
        title: "Connection Failed",
        message: "Backend unreachable. Start the FastAPI server.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear all chat messages?")) return;
    triggerHaptic(30);
    try {
      await axios.delete(`${API_BASE}/chat/history`);
      setMessages([]);
      showToast({ type: "info", title: "Chat Cleared", duration: 2500 });
    } catch {}
  };

  const togglePin = async (msgId: string) => {
    triggerHaptic(15);
    try {
      await axios.post(`${API_BASE}/chat/pin`, { message_id: msgId });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, pinned: !m.pinned } : m)));
    } catch {}
  };

  const handleExport = async (format: "json" | "txt") => {
    triggerHaptic(20);
    try {
      const res = await axios.get(`${API_BASE}/chat/export?format=${format}`);
      const data = res.data;
      const fileData = format === "txt" ? data.file_content : JSON.stringify(data.history, null, 2);
      const blob = new Blob([fileData], {
        type: format === "txt" ? "text/plain" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ type: "success", title: "Export Complete", message: data.filename, duration: 3000 });
    } catch {
      showToast({ type: "error", title: "Export Failed", duration: 3000 });
    }
  };

  // ── Filtered messages ─────────────────────────────────────────────────────
  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProv = PROVIDERS.find((p) => p.id === activeProvider) ?? PROVIDERS[0];

  // ── Textarea auto-resize ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main
      className="mx-auto w-full max-w-[430px] flex flex-col animate-page-enter"
      style={{ height: "100svh", background: "rgba(4,5,7,0.7)" }}
    >
      {/* ── TOP APPBAR ──────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 h-[60px] sticky top-0 z-30 flex-shrink-0"
        style={{
          background: "rgba(4,5,7,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Left: AI Avatar + Title */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-accent))",
              boxShadow: "0 0 16px rgba(var(--dynamic-primary-rgb),0.4)",
            }}
          >
            <MessageSquare className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">AI LifeOS</h1>
            <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5"
               style={{ color: "var(--dynamic-primary)" }}>
              {activeProv.emoji} {activeProv.label} · Active
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { triggerHaptic(10); setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }}
            className="p-2 rounded-xl transition-all"
            style={{ color: showSearch ? "white" : "#64748b", background: showSearch ? "rgba(255,255,255,0.08)" : "transparent" }}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleExport("txt")}
            className="p-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: "#64748b" }}
            title="Export TXT"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: "#64748b" }}
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── PROVIDER SELECTOR BAR ────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0 overflow-x-auto no-scrollbar"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="relative flex-shrink-0" ref={providerMenuRef}>
          <button
            onClick={() => { setShowProviderMenu(!showProviderMenu); triggerHaptic(10); }}
            className="provider-pill"
            style={{
              borderColor: "rgba(var(--dynamic-primary-rgb),0.3)",
              background: "rgba(var(--dynamic-primary-rgb),0.08)",
              color: "#c4b5fd",
            }}
          >
            <Settings2 className="w-3 h-3" />
            <span>{activeProv.emoji} {activeProv.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showProviderMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {showProviderMenu && (
            <div
              className="absolute top-8 left-0 z-50 rounded-2xl overflow-hidden animate-slide-up"
              style={{
                background: "rgba(10,10,18,0.97)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                minWidth: 180,
              }}
            >
              {PROVIDERS.map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => switchProvider(prov.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="text-base">{prov.emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{prov.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {prov.id === "ollama" ? "Local Inference" : "Cloud API"}
                    </div>
                  </div>
                  {activeProvider === prov.id && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: prov.color }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick action chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
            <button
              key={prompt}
              onClick={() => { triggerHaptic(10); handleSendMessage(null, prompt); }}
              className="suggestion-chip flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────────── */}
      {showSearch && (
        <div
          className="px-4 py-2.5 flex items-center gap-3 animate-slide-up flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
            className="bg-transparent text-xs text-white placeholder-slate-600 outline-none flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
            </button>
          )}
          {searchQuery && (
            <span className="text-[10px] text-slate-500 font-semibold flex-shrink-0">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* ── PINNED BOOKMARKS STRIP ───────────────────────────────────────── */}
      {messages.some((m) => m.pinned) && (
        <div
          className="flex items-center gap-2.5 px-4 py-2 overflow-x-auto no-scrollbar flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(var(--dynamic-primary-rgb),0.04)" }}
        >
          <Pin className="w-3 h-3 flex-shrink-0" style={{ color: "var(--dynamic-primary)" }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex-shrink-0">Pins</span>
          {messages.filter((m) => m.pinned).map((pm) => (
            <button
              key={pm.id}
              onClick={() => {
                triggerHaptic(10);
                document.getElementById(`msg-${pm.id}`)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-shrink-0 px-3 py-1 rounded-xl text-[11px] text-slate-300 max-w-[120px] truncate"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {pm.content}
            </button>
          ))}
        </div>
      )}

      {/* ── MESSAGES AREA ────────────────────────────────────────────────── */}
      <div
        className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-3 px-4 py-4"
        style={{ paddingBottom: "1rem" }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 py-12">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(var(--dynamic-primary-rgb),0.15), rgba(var(--dynamic-accent-rgb),0.1))",
                border: "1px solid rgba(var(--dynamic-primary-rgb),0.15)",
              }}
            >
              <MessageSquare className="w-7 h-7" style={{ color: "var(--dynamic-primary)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {searchQuery ? "No results found" : "Start a conversation"}
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-[240px] leading-relaxed">
                {searchQuery
                  ? `No messages match "${searchQuery}"`
                  : "Ask about your goals, upload a PDF to analyze, or tap a suggestion above."}
              </p>
            </div>
            {!searchQuery && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSendMessage(null, p)}
                    className="suggestion-chip"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.role === "user";
            const isSpeaking = speakingMsgId === msg.id;
            return (
              <div
                id={`msg-${msg.id}`}
                key={msg.id}
                className={`flex flex-col gap-1.5 max-w-[88%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                {/* Attachments display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) =>
                      att.type === "image" && att.url ? (
                        <img
                          key={idx}
                          src={att.url}
                          alt={att.name}
                          className="rounded-2xl object-cover border"
                          style={{ width: 180, height: 120, borderColor: "rgba(255,255,255,0.08)" }}
                        />
                      ) : (
                        <div key={idx} className="file-chip">
                          {att.type === "pdf"
                            ? <FileText className="w-3 h-3 text-red-400 flex-shrink-0" />
                            : <File className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                          <span className="truncate">{att.name}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Message bubble */}
                {(msg.content || loading) && (
                  <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>

                    {/* Bubble actions */}
                    <div
                      className="flex items-center gap-2.5 mt-2 pt-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-[10px] text-slate-500 flex-grow">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>

                      <button
                        onClick={() => togglePin(msg.id)}
                        className="transition-colors"
                        style={{ color: msg.pinned ? "var(--dynamic-primary)" : "#475569" }}
                        title={msg.pinned ? "Unpin" : "Pin message"}
                      >
                        <Pin className={`w-3 h-3 ${msg.pinned ? "fill-current" : ""}`} />
                      </button>

                      {!isUser && (
                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className={`transition-colors ${isSpeaking ? "animate-pulse" : ""}`}
                          style={{ color: isSpeaking ? "var(--dynamic-primary)" : "#475569" }}
                          title="Read aloud"
                        >
                          {isSpeaking
                            ? <VolumeX className="w-3.5 h-3.5" />
                            : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-1.5 mr-auto">
            <div
              className="px-4 py-3.5 rounded-3xl rounded-tl-sm flex gap-1.5 items-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── ATTACHMENT PREVIEW STRIP ─────────────────────────────────────── */}
      {attachments.length > 0 && (
        <div
          className="px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0 animate-slide-up"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
        >
          {attachments.map((att) => (
            <div key={att.name} className="relative flex-shrink-0">
              {att.type === "image" && att.preview ? (
                <img
                  src={att.preview}
                  alt={att.name}
                  className="w-14 h-14 rounded-xl object-cover"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {att.type === "pdf"
                    ? <FileText className="w-5 h-5 text-red-400" />
                    : <File className="w-5 h-5 text-slate-400" />}
                  <span className="text-[8px] text-slate-500 text-center px-1 truncate w-full leading-tight">
                    {att.size}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(att.name)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "rgba(15,15,20,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <X className="w-3 h-3 text-slate-300" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── BOTTOM INPUT BAR ─────────────────────────────────────────────── */}
      <div
        className="px-3 py-2.5 flex-shrink-0 flex flex-col gap-2"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(4,5,7,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Export row */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 px-1">
          <span className="font-semibold">{messages.length} messages</span>
          <div className="flex gap-3">
            <button onClick={() => handleExport("txt")} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <FileText className="w-3 h-3" /> TXT
            </button>
            <button onClick={() => handleExport("json")} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <FileCode className="w-3 h-3" /> JSON
            </button>
            <button onClick={fetchHistory} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Input row */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2"
        >
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10 active:scale-90"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}
            title="Attach photo or PDF"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx"
            multiple
            onChange={handleFileSelect}
          />

          {/* Text area */}
          <div
            className="flex-grow flex items-end gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              minHeight: 44,
            }}
          >
            <textarea
              ref={inputRef}
              placeholder={isListening ? "🎙 Listening..." : attachments.length > 0 ? "Add a message about the files..." : "Message AI LifeOS..."}
              className="flex-grow bg-transparent text-sm text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120, height: 24, overflowY: "auto" }}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
            />

            {/* Mic button (inside input) */}
            <button
              type="button"
              onClick={startVoiceInput}
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: isListening ? "rgba(239,68,68,0.15)" : "transparent",
                color: isListening ? "#ef4444" : "#475569",
              }}
              title="Voice input"
            >
              <Mic className={`w-4 h-4 ${isListening ? "animate-bounce" : ""}`} />
            </button>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={loading || (!inputValue.trim() && attachments.length === 0)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{
              background: loading || (!inputValue.trim() && attachments.length === 0)
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-accent))",
              boxShadow: loading || (!inputValue.trim() && attachments.length === 0)
                ? "none"
                : "0 4px 16px rgba(var(--dynamic-primary-rgb),0.35)",
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </main>
  );
}
