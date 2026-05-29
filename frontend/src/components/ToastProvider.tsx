"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Sparkles,
  Zap,
  Brain,
  Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "info" | "success" | "warning" | "error" | "suggestion";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persist
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  showSuggestion: (msg: string, category?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

// ─── AI Suggestion messages (rotated periodically) ────────────────────────────

const AI_SUGGESTIONS = [
  { msg: "How's your study progress today? Let me help you plan your sessions.", cat: "study" },
  { msg: "Time for a hydration check! You should drink water now 💧", cat: "fitness" },
  { msg: "Want me to review your tasks for today?", cat: "planner" },
  { msg: "Try asking me: 'Summarize my learning goals this week'", cat: "chat" },
  { msg: "I can generate a custom workout plan — just ask!", cat: "fitness" },
  { msg: "Ask me anything about your schedule, goals, or health.", cat: "general" },
  { msg: "How about a 5-minute mindful breathing break? 🧘", cat: "fitness" },
  { msg: "Want a quick summary of your pending planner tasks?", cat: "planner" },
  { msg: "I noticed you haven't chatted in a while. Need anything?", cat: "chat" },
  { msg: "Tip: You can upload PDFs and images for me to analyze!", cat: "general" },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  study: <Brain className="w-4 h-4 text-blue-400" />,
  fitness: <Activity className="w-4 h-4 text-emerald-400" />,
  planner: <Zap className="w-4 h-4 text-amber-400" />,
  chat: <Sparkles className="w-4 h-4 text-violet-400" />,
  general: <Bell className="w-4 h-4 text-indigo-400" />,
};

// ─── Toast Item Component ──────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onDismiss, 240);
  }, [onDismiss]);

  useEffect(() => {
    const dur = toast.duration ?? 5000;
    if (dur > 0) {
      timerRef.current = setTimeout(dismiss, dur);
    }
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  const typeConfig = {
    info: {
      icon: toast.icon ?? <Bell className="w-4 h-4 text-indigo-400" />,
      accent: "rgba(99,102,241,0.18)",
      border: "rgba(99,102,241,0.25)",
      bar: "#6366f1",
    },
    success: {
      icon: toast.icon ?? <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      accent: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.25)",
      bar: "#10b981",
    },
    warning: {
      icon: toast.icon ?? <AlertTriangle className="w-4 h-4 text-amber-400" />,
      accent: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.25)",
      bar: "#f59e0b",
    },
    error: {
      icon: toast.icon ?? <XCircle className="w-4 h-4 text-red-400" />,
      accent: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      bar: "#ef4444",
    },
    suggestion: {
      icon: toast.icon ?? <Sparkles className="w-4 h-4 text-violet-400" />,
      accent: "rgba(139,92,246,0.12)",
      border: "rgba(139,92,246,0.25)",
      bar: "#8b5cf6",
    },
  };

  const cfg = typeConfig[toast.type];

  return (
    <div
      className={exiting ? "toast exit" : "toast"}
      style={{ borderColor: cfg.border, background: `rgba(8,8,14,0.95)` }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 3,
          borderRadius: 9999,
          flexShrink: 0,
          alignSelf: "stretch",
          background: cfg.bar,
          opacity: 0.8,
        }}
      />

      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: cfg.accent }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div className="flex-grow min-w-0">
        <p className="text-xs font-bold text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); dismiss(); }}
            className="mt-1.5 text-[11px] font-bold"
            style={{ color: cfg.bar }}
          >
            {toast.action.label} →
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const suggestionTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const suggestionIndexRef = useRef(0);

  const showToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = "toast_" + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // max 5 toasts
    // Haptic
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(toast.type === "error" ? [20, 10, 20] : 12);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuggestion = useCallback(
    (msg: string, category = "general") => {
      showToast({
        type: "suggestion",
        title: "AI Suggestion",
        message: msg,
        duration: 7000,
        icon: CATEGORY_ICONS[category] ?? <Sparkles className="w-4 h-4 text-violet-400" />,
      });
    },
    [showToast]
  );

  // Periodic AI suggestions (every 3.5 minutes)
  useEffect(() => {
    const schedule = () => {
      suggestionTimerRef.current = setTimeout(() => {
        const item = AI_SUGGESTIONS[suggestionIndexRef.current % AI_SUGGESTIONS.length];
        suggestionIndexRef.current++;
        showSuggestion(item.msg, item.cat);
        schedule();
      }, 210_000); // 3.5 min
    };

    // First suggestion after 90 seconds
    const firstTimer = setTimeout(() => {
      const item = AI_SUGGESTIONS[0];
      showSuggestion(item.msg, item.cat);
      suggestionIndexRef.current = 1;
      schedule();
    }, 90_000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(suggestionTimerRef.current);
    };
  }, [showSuggestion]);

  // Browser push notification on page load (if permission granted)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "granted") {
      setTimeout(() => {
        try {
          new Notification("AI LifeOS Ready", {
            body: "Your AI assistant is online and ready to help!",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "lifeos-ready",
            silent: false,
          });
        } catch (_) {}
      }, 3000);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, showSuggestion }}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              toast={t}
              onDismiss={() => dismissToast(t.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
