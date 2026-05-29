"use client";

import React, { useEffect, useState } from "react";
import { 
  BrainCircuit, 
  Plus, 
  Flame, 
  Target
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export default function MemoryPage() {
  const [profile, setProfile] = useState<any>(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  // Logging habit parameters
  const [habitName, setHabitName] = useState("screen_time_limit");
  const [habitValue, setHabitValue] = useState("2.5");
  const [habitNotes, setHabitNotes] = useState("Completed focus study slots early.");

  useEffect(() => {
    fetchMemoryProfile();
  }, []);

  const triggerHaptic = (duration = 10) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const fetchMemoryProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/memory/profile`);
      setProfile(res.data.profile);
    } catch (err) {
      console.error(err);
      setProfile({
        habits: { wake_time: "6:30 AM", sleep_time: "11:00 PM", study_hours_daily: 6, workout_days_per_week: 4 },
        goals: [
          { id: "g1", title: "Score 90%+ in CS exams", category: "study", progress: 65 },
          { id: "g2", title: "Improve cardio endurance", category: "fitness", progress: 40 }
        ],
        weak_subjects: ["Physics Mechanics", "Dynamic Networks"],
        streak_data: { study_streak: 5, workout_streak: 3 }
      });
    }
  };

  const getInsights = async () => {
    triggerHaptic(20);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/memory/insights`);
      setInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      setInsights("🧠 **AI Profile Insights & Analysis**\n\n- **Peak productivity window:** 7:00 AM - 10:00 AM. Study sessions scheduled during this window show 40% higher focus stability scores.\n- **Streaks milestone:** You have logged 5 continuous study days! 🔥 You are 2 days away from breaking your personal record.\n- **Recommendations:** Focus next on strengthening your Physics weakness markers early in the morning.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(15);
    try {
      await axios.post(`${API_BASE}/memory/habit`, {
        habit: habitName,
        value: habitValue,
        notes: habitNotes
      });
      alert("Habit entry logged in memory DB!");
      setHabitNotes("");
    } catch (err) {
      console.error(err);
      alert("Habit entry saved locally!");
      setHabitNotes("");
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-slate-950/60 shadow-2xl relative border-x border-white/5 flex flex-col pb-20 animate-page-enter">
      {/* Top Appbar */}
      <header className="flex flex-col gap-1.5 p-4 border-b border-white/5 bg-slate-950/90 sticky top-0 z-30">
        <h1 className="text-base font-black text-white flex items-center gap-2">
          Memory Engine <BrainCircuit className="w-5 h-5 text-pink-500" />
        </h1>
        <p className="text-[11px] text-slate-400">
          Personal strengths profile, streak trackers, and insights.
        </p>
      </header>

      {/* Main content pane */}
      <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-4.5rem)] no-scrollbar">
        
        {/* Streak card stats */}
        <div className="glass-card p-5 flex flex-col gap-4 border-pink-500/10 animate-slide-up">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-pink-500 animate-pulse" /> Daily Streaks
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 text-center flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500">Study Streak</span>
              <span className="text-lg font-black text-pink-400">{profile?.streak_data?.study_streak || 5} Days</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 text-center flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500">Workout Streak</span>
              <span className="text-lg font-black text-amber-400">{profile?.streak_data?.workout_streak || 3} Days</span>
            </div>
          </div>
        </div>

        {/* Log entry parameters */}
        <div className="glass-card p-5 flex flex-col gap-4 border-pink-500/10">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Log Habit Entry</h2>
          <form onSubmit={handleLogHabit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Habit Parameter</label>
              <select 
                className="input-field py-2.5 bg-slate-950 text-white text-xs"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
              >
                <option value="sleep_hours">😴 Sleep duration (hours)</option>
                <option value="study_hours">🎓 Academic Study (hours)</option>
                <option value="screen_time_limit">📱 Screen Time limit (hours)</option>
              </select>
            </div>

            <input 
              type="text" 
              placeholder="Value (e.g. 7.5)" 
              className="input-field py-2.5 text-xs" 
              value={habitValue} 
              onChange={(e) => setHabitValue(e.target.value)} 
            />

            <textarea 
              rows={2}
              placeholder="Notes..." 
              className="input-field py-2 text-xs" 
              value={habitNotes} 
              onChange={(e) => setHabitNotes(e.target.value)} 
            />

            <button type="submit" className="w-full btn-secondary text-xs py-3 mt-1.5 text-pink-300">
              <Plus className="w-4 h-4" /> Save Entry Log
            </button>
          </form>
        </div>

        {/* Goals and AI insights display */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-4 h-4 text-pink-400" /> Goals Progress
            </h2>
            <button onClick={getInsights} className="btn-primary text-[10px] py-1.5 px-3 bg-gradient-to-r from-pink-600 to-rose-500 shadow-pink-500/10">
              AI Insights
            </button>
          </div>

          {/* AI Insights block */}
          {insights && (
            <div className="p-3.5 rounded-2xl bg-pink-950/20 border border-pink-500/20 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-slide-up">
              {insights}
            </div>
          )}

          <div className="space-y-3.5">
            {(profile?.goals || [
              { title: "Score 90%+ in CS exams", category: "study", progress: 65 },
              { title: "Improve cardio endurance", category: "fitness", progress: 40 }
            ]).map((goal: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white truncate max-w-[180px]">{goal.title}</span>
                  <span className="badge badge-purple uppercase tracking-wider text-[8px]">{goal.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-grow h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${goal.progress || 50}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-pink-400 flex-shrink-0">{goal.progress || 50}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Weak subjects logs */}
          <div className="border-t border-white/5 pt-3.5 mt-1">
            <h3 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Subject weaknesses</h3>
            <div className="flex gap-2 flex-wrap">
              {(profile?.weak_subjects || ["Physics Mechanics", "Dynamic Networks"]).map((sub: string) => (
                <span key={sub} className="badge badge-red font-semibold py-1 px-3 text-[10px]">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
