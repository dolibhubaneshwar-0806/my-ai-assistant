"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays, Sparkles, Plus, Trash2, Clock, X, ChevronDown
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
type Tab = "blocks" | "optimizer";

const CAT_COLORS: Record<string, string> = {
  study: "#8b5cf6", fitness: "#f59e0b", routine: "#06b6d4", personal: "#ec4899"
};
const CAT_OPTIONS = [
  { value: "study",   label: "🎓 Study" },
  { value: "fitness", label: "🏋️ Fitness" },
  { value: "routine", label: "🔁 Routine" },
  { value: "personal",label: "💼 Personal" },
];

export default function PlannerPage() {
  const [activeTab, setActiveTab]     = useState<Tab>("blocks");
  const [blocks, setBlocks]           = useState<any[]>([]);
  const [showForm, setShowForm]       = useState(false);
  const [newTitle, setNewTitle]       = useState("");
  const [newStart, setNewStart]       = useState("09:00");
  const [newEnd, setNewEnd]           = useState("10:00");
  const [newType, setNewType]         = useState("study");
  const [tasks, setTasks]             = useState("Complete CS Lab, Study Physics, 30 min cardio");
  const [deadlines, setDeadlines]     = useState("CS Lab: Tonight, Physics Exam: June 15");
  const [workHours, setWorkHours]     = useState(8);
  const [schedule, setSchedule]       = useState("");
  const [loading, setLoading]         = useState(false);

  const haptic = (ms = 10) => window.navigator?.vibrate?.(ms);

  useEffect(() => {
    axios.get(`${API_BASE}/planner/today`)
      .then(r => setBlocks(r.data.blocks || []))
      .catch(() => setBlocks([
        { id: "d1", title: "Morning Deep Work",   start: "07:00", end: "09:00", type: "study" },
        { id: "d2", title: "Cardio Session",       start: "15:30", end: "16:30", type: "fitness" },
        { id: "d3", title: "Evening Review",       start: "19:00", end: "21:00", type: "study" },
      ]));
  }, []);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    haptic(15);
    const newBlock = {
      id: `local_${Date.now()}`, title: newTitle,
      start: newStart, end: newEnd, type: newType,
    };
    try {
      const r = await axios.post(`${API_BASE}/planner/events`, {
        title: newTitle, start_time: newStart, end_time: newEnd,
        priority: "medium", event_type: newType,
      });
      if (r.data.success) setBlocks(p => [...p, r.data.event]);
      else setBlocks(p => [...p, newBlock]);
    } catch { setBlocks(p => [...p, newBlock]); }
    setNewTitle(""); setShowForm(false);
  };

  const deleteBlock = async (id: string) => {
    haptic(20);
    try { await axios.delete(`${API_BASE}/planner/events/${id}`); } catch {}
    setBlocks(p => p.filter(b => b.id !== id));
  };

  const generateSchedule = async () => {
    haptic(20); setLoading(true);
    try {
      const r = await axios.post(`${API_BASE}/planner/generate`, {
        tasks: tasks.split(",").map(t => t.trim()),
        deadlines: deadlines.split(",").map(d => d.trim()),
        work_hours: workHours,
      });
      setSchedule(r.data.schedule);
    } catch {
      setSchedule("📅 **AI Optimized Schedule:**\n\n07:00–08:30  Morning Study Sprint (CS Lab)\n09:00–09:30  Breakfast & Hydration break\n09:30–12:00  Physics Chapter 3 focus blocks\n12:00–13:00  Lunch + Rest\n15:30–16:00  30 min cardio workout\n16:00–16:30  Cool-down & snack\n19:00–21:00  Evening review session\n22:00–22:30  Wind-down routine");
    } finally { setLoading(false); }
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main
      className="mx-auto w-full max-w-[430px] flex flex-col pb-24 animate-page-enter"
      style={{ minHeight: "100svh", background: "rgba(4,5,7,0.7)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 h-[60px] sticky top-0 z-30 flex-shrink-0"
        style={{
          background: "rgba(4,5,7,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #06b6d4, #6366f1)" }}>
            <CalendarDays className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">Daily Planner</h1>
            <p className="text-[10px] text-slate-500">{today}</p>
          </div>
        </div>
        {activeTab === "blocks" && (
          <button
            onClick={() => { haptic(10); setShowForm(!showForm); }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: showForm ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)",
              border: showForm ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: showForm ? "#22d3ee" : "#64748b",
            }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </header>

      {/* Tab Bar */}
      <div
        className="flex border-b sticky top-[60px] z-20"
        style={{ background: "rgba(4,5,7,0.95)", borderColor: "rgba(255,255,255,0.05)" }}
      >
        {(["blocks", "optimizer"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { haptic(10); setActiveTab(t); }}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2"
            style={{
              color: activeTab === t ? "#22d3ee" : "#4b5563",
              borderColor: activeTab === t ? "#22d3ee" : "transparent",
            }}
          >
            {t === "blocks" ? "📅 Time Blocks" : "✨ AI Optimizer"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 overflow-y-auto no-scrollbar">

        {/* ── TIME BLOCKS TAB ─────────────────────────────────────────── */}
        {activeTab === "blocks" && (
          <>
            {/* Add form */}
            {showForm && (
              <form
                onSubmit={handleAddBlock}
                className="glass-card p-4 flex flex-col gap-3 animate-slide-up"
              >
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add Time Block</h3>
                <input
                  type="text" placeholder="Block title..." required
                  className="input-field py-2.5 text-xs"
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider">Start</label>
                    <input type="time" className="input-field py-2 text-xs" value={newStart}
                      onChange={(e) => setNewStart(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider">End</label>
                    <input type="time" className="input-field py-2 text-xs" value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CAT_OPTIONS.map((c) => (
                    <button
                      key={c.value} type="button"
                      onClick={() => { haptic(10); setNewType(c.value); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: newType === c.value ? `${CAT_COLORS[c.value]}25` : "rgba(255,255,255,0.04)",
                        border: newType === c.value ? `1px solid ${CAT_COLORS[c.value]}50` : "1px solid rgba(255,255,255,0.06)",
                        color: newType === c.value ? CAT_COLORS[c.value] : "#6b7280",
                      }}
                    >{c.label}</button>
                  ))}
                </div>
                <button type="submit" className="w-full btn-primary py-2.5 text-xs">Add Block</button>
              </form>
            )}

            {/* Blocks list */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Today's Blocks</h2>
                <span className="ml-auto text-[10px] font-bold text-slate-500">{blocks.length} events</span>
              </div>

              {sortedBlocks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                  <CalendarDays className="w-8 h-8 opacity-30" />
                  <p className="text-xs text-center">No time blocks yet. Tap + to add one.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <div className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ background: CAT_COLORS[b.type] ?? "#8b5cf6" }} />
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-white truncate">{b.title ?? b.name}</p>
                        <p className="text-[10px] text-slate-500">{b.start} – {b.end}</p>
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: `${CAT_COLORS[b.type] ?? "#8b5cf6"}20`,
                          color: CAT_COLORS[b.type] ?? "#8b5cf6",
                          border: `1px solid ${CAT_COLORS[b.type] ?? "#8b5cf6"}30`,
                        }}
                      >{b.type}</span>
                      <button onClick={() => deleteBlock(b.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── AI OPTIMIZER TAB ────────────────────────────────────────── */}
        {activeTab === "optimizer" && (
          <>
            <div className="glass-card p-4 flex flex-col gap-4 animate-page-enter">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Schedule Optimizer</h2>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Tasks to Schedule</label>
                <textarea rows={3} className="input-field py-2 text-xs" value={tasks}
                  onChange={(e) => setTasks(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Urgent Deadlines</label>
                <input type="text" className="input-field py-2.5 text-xs" value={deadlines}
                  onChange={(e) => setDeadlines(e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 flex justify-between">
                  <span>Target Work Hours</span>
                  <span className="font-extrabold text-cyan-400">{workHours}h</span>
                </label>
                <input type="range" min={2} max={12} className="w-full accent-cyan-400"
                  value={workHours} onChange={(e) => setWorkHours(Number(e.target.value))} />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>2h</span><span>12h</span>
                </div>
              </div>

              <button
                onClick={generateSchedule}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #06b6d4, #6366f1)", boxShadow: "0 4px 20px rgba(6,182,212,0.25)" }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Optimizing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate AI Schedule</>
                )}
              </button>
            </div>

            {schedule && (
              <div
                className="rounded-2xl p-4 animate-slide-up mb-4"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}
              >
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-3">Generated Schedule</p>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{schedule}</p>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
