"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, Brain, Activity, CalendarDays, MessageSquare,
  Droplet, TrendingUp, Bell, ChevronRight, Dumbbell, BookOpen,
  Zap, Clock, Sun, Sunset, Moon
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", icon: Sun,    color: "#fbbf24" };
  if (h < 17) return { text: "Good Afternoon", icon: Sunset, color: "#f97316" };
  return { text: "Good Evening", icon: Moon, color: "#818cf8" };
}

export default function DashboardPage() {
  const [profile, setProfile]           = useState<any>(null);
  const [fitnessSummary, setFitness]    = useState<any>(null);
  const [todayBlocks, setTodayBlocks]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [time, setTime]                 = useState(new Date());
  const [userName, setUserName]         = useState("Operator");

  const maxGlasses = 8;
  const greeting   = getGreeting();
  const GreetIcon  = greeting.icon;

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Restore hydration + name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lifeos_water");
    if (stored) setWaterGlasses(Number(stored));
    const name = localStorage.getItem("lifeos_username");
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, f, pl] = await Promise.allSettled([
          axios.get(`${API_BASE}/memory/profile`),
          axios.get(`${API_BASE}/fitness/summary`),
          axios.get(`${API_BASE}/planner/today`),
        ]);
        if (p.status === "fulfilled") {
          setProfile(p.value.data.profile);
          const n = p.value.data.profile?.name;
          if (n) { setUserName(n); localStorage.setItem("lifeos_username", n); }
        }
        if (f.status === "fulfilled") setFitness(f.value.data);
        if (pl.status === "fulfilled") setTodayBlocks(pl.value.data.blocks || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const tapWater = () => {
    if (waterGlasses >= maxGlasses) return;
    if (window.navigator?.vibrate) window.navigator.vibrate(12);
    const n = waterGlasses + 1;
    setWaterGlasses(n);
    localStorage.setItem("lifeos_water", String(n));
  };

  const QUICK_ACTIONS = [
    { label: "Ask AI",      href: "/chat",     icon: MessageSquare, from: "#6366f1", to: "#8b5cf6" },
    { label: "Plan Day",    href: "/planner",  icon: CalendarDays,  from: "#06b6d4", to: "#3b82f6" },
    { label: "Log Workout", href: "/fitness",  icon: Dumbbell,      from: "#f59e0b", to: "#ef4444" },
    { label: "Study Now",   href: "/study",    icon: BookOpen,      from: "#10b981", to: "#06b6d4" },
  ];

  const blockColors: Record<string,string> = {
    study: "#8b5cf6", fitness: "#f59e0b", routine: "#06b6d4", personal: "#ec4899"
  };

  const demoBlocks = [
    { id:"d1", title:"Morning Deep Work",    start:"07:00", end:"09:00", type:"study"   },
    { id:"d2", title:"Cardio Workout",       start:"15:30", end:"16:30", type:"fitness" },
    { id:"d3", title:"Evening Study Block",  start:"19:00", end:"21:00", type:"study"   },
  ];

  const blocks = todayBlocks.length > 0 ? todayBlocks : demoBlocks;

  return (
    <main
      className="mx-auto w-full max-w-[430px] flex flex-col pb-24 animate-page-enter"
      style={{ minHeight: "100svh", background: "rgba(4,5,7,0.7)" }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 h-[60px] sticky top-0 z-30 flex-shrink-0"
        style={{
          background: "rgba(4,5,7,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <GreetIcon className="w-3.5 h-3.5" style={{ color: greeting.color }} />
            <span className="text-[11px] font-bold" style={{ color: greeting.color }}>
              {greeting.text}
            </span>
          </div>
          <h1 className="text-sm font-black text-white leading-tight">{userName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Bell className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pt-4 overflow-y-auto no-scrollbar">

        {/* ── HERO CLOCK CARD ─────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(var(--dynamic-primary-rgb),0.18) 0%, rgba(var(--dynamic-accent-rgb),0.1) 100%)",
            border: "1px solid rgba(var(--dynamic-primary-rgb),0.2)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(var(--dynamic-primary-rgb),0.12)" }}
          />
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p
            className="text-4xl font-black tracking-tight"
            style={{ color: "white", fontVariantNumeric: "tabular-nums" }}
          >
            {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI System Active</span>
          </div>
        </div>

        {/* ── STATS ROW ───────────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {[
            { label: "Study Streak", value: `${profile?.streak_data?.study_streak ?? 5}d`, icon: Brain,      color: "#8b5cf6" },
            { label: "Workouts",     value: `${fitnessSummary?.total_workouts ?? 3}`,      icon: Activity,   color: "#f59e0b" },
            { label: "Hydration",    value: `${waterGlasses}/8`,                           icon: Droplet,    color: "#06b6d4" },
            { label: "Trending",     value: "↑ Good",                                      icon: TrendingUp, color: "#10b981" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex-shrink-0 w-28 rounded-2xl p-3 flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <Icon className="w-4 h-4" style={{ color: s.color }} />
                <p className="text-lg font-black text-white leading-none">{s.value}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => window.navigator?.vibrate?.(12)}
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${a.from}22, ${a.to}15)`,
                  border: `1px solid ${a.from}30`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                >
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{a.label}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── TODAY'S SCHEDULE ─────────────────────────────────────────── */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--dynamic-primary)" }} />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Today's Schedule</h2>
            </div>
            <Link href="/planner" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {blocks.slice(0, 4).map((b: any, i: number) => (
              <div
                key={b.id ?? i}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ background: blockColors[b.type] ?? "#8b5cf6" }}
                />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-white truncate">{b.title ?? b.name}</p>
                  <p className="text-[10px] text-slate-500">{b.start} – {b.end}</p>
                </div>
                <span
                  className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: `${blockColors[b.type] ?? "#8b5cf6"}20`,
                    color: blockColors[b.type] ?? "#8b5cf6",
                    border: `1px solid ${blockColors[b.type] ?? "#8b5cf6"}30`,
                  }}
                >
                  {b.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── HYDRATION TRACKER ────────────────────────────────────────── */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Hydration</h2>
            </div>
            <span className="text-xs font-black text-cyan-300">{waterGlasses}/{maxGlasses} glasses</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: maxGlasses }).map((_, i) => (
              <button
                key={i}
                onClick={tapWater}
                className="flex-1 h-3 rounded-full transition-all duration-300"
                style={{
                  background: i < waterGlasses
                    ? "linear-gradient(90deg, #06b6d4, #3b82f6)"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: i < waterGlasses ? "0 0 6px rgba(6,182,212,0.4)" : "none",
                }}
              />
            ))}
          </div>
          <button
            onClick={tapWater}
            disabled={waterGlasses >= maxGlasses}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-cyan-300 transition-all active:scale-95"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            + Log 1 Glass of Water
          </button>
        </div>

        {/* ── AI INSIGHT CARD ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden mb-2"
          style={{
            background: "rgba(var(--dynamic-primary-rgb),0.06)",
            border: "1px solid rgba(var(--dynamic-primary-rgb),0.15)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: "rgba(var(--dynamic-primary-rgb),0.12)" }}
          />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--dynamic-primary)" }} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI Memory Insight</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Based on your recent routine, you're 32% more productive when your morning study
            session follows a full 7.5h sleep cycle. Hydrate early for peak cognitive performance!
          </p>
          <Link
            href="/chat"
            className="text-[11px] font-bold transition-colors flex items-center gap-1"
            style={{ color: "var(--dynamic-primary)" }}
          >
            Ask AI for personalized tips <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </main>
  );
}
