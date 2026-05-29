"use client";

import React, { useState } from "react";
import {
  Activity, Dumbbell, Leaf, Heart, Zap, Plus, Check,
  Loader2, ChevronRight, Flame
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
type Tab = "workout" | "nutrition" | "vitamins";

const ENERGY_EMOJI = ["😴", "😐", "🙂", "💪", "🔥"];
const TAB_ICONS = {
  workout:   { icon: Dumbbell, color: "#f59e0b", from: "#f59e0b", to: "#ef4444" },
  nutrition: { icon: Leaf,    color: "#10b981", from: "#10b981", to: "#06b6d4" },
  vitamins:  { icon: Heart,   color: "#ec4899", from: "#ec4899", to: "#8b5cf6" },
};

export default function FitnessPage() {
  const [activeTab, setActiveTab]         = useState<Tab>("workout");
  const [loading, setLoading]             = useState(false);
  const [goal, setGoal]                   = useState("Muscle Gain");
  const [energy, setEnergy]               = useState(4);
  const [equipment, setEquipment]         = useState("Dumbbells, Pull-up Bar");
  const [availableFood, setAvailableFood] = useState("Oats, Rice, Milk, Chicken, Eggs");
  const [symptoms, setSymptoms]           = useState("Fatigue, muscle stiffness");
  const [mealsPerDay, setMealsPerDay]     = useState(3);
  const [workoutPlan, setWorkoutPlan]     = useState("");
  const [nutritionPlan, setNutritionPlan] = useState("");
  const [vitaminPlan, setVitaminPlan]     = useState("");
  const [loggedToday, setLoggedToday]     = useState(false);

  const haptic = (ms = 10) => window.navigator?.vibrate?.(ms);

  const getResult = async () => {
    haptic(20); setLoading(true);
    try {
      if (activeTab === "workout") {
        const r = await axios.post(`${API_BASE}/fitness/recommend`, {
          goal, energy_level: energy, equipment: equipment.split(",").map(e => e.trim()), duration_minutes: 45
        });
        setWorkoutPlan(r.data.recommendation);
      } else if (activeTab === "nutrition") {
        const r = await axios.post(`${API_BASE}/fitness/food`, {
          available_foods: availableFood.split(",").map(f => f.trim()), goal, meals_per_day: mealsPerDay
        });
        setNutritionPlan(r.data.nutrition_plan);
      } else {
        const r = await axios.post(`${API_BASE}/fitness/vitamins`, {
          symptoms: symptoms.split(",").map(s => s.trim())
        });
        setVitaminPlan(r.data.guidance);
      }
    } catch {
      if (activeTab === "workout")
        setWorkoutPlan("🏋️ **Custom Workout Plan**\n\n**Warm-up (5 min):** Arm circles, leg swings\n\n**Main (35 min):**\n• 4×10 Dumbbell Squats\n• 3×12 Romanian Deadlifts\n• 3×10 Pull-ups / Rows\n• 3×12 Overhead Press\n• 3×45s Plank\n\n**Cool-down (5 min):** Static stretches");
      else if (activeTab === "nutrition")
        setNutritionPlan("🥗 **Home Nutrition Plan**\n\n**Breakfast:** Oats + milk + 2 eggs (~450 kcal)\n**Lunch:** Rice + dal + vegetables (~500 kcal)\n**Dinner:** Chicken/Paneer + rice + salad (~550 kcal)\n**Snacks:** Almonds + peanuts");
      else
        setVitaminPlan("🩺 **Deficiency Analysis**\n\nSymptoms suggest possible Vitamin D3 or Magnesium gap.\n\n**Dietary Fix:** Spinach, pumpkin seeds, egg yolks\n**Action:** Basic blood test recommended");
    } finally { setLoading(false); }
  };

  const currentResult = activeTab === "workout" ? workoutPlan : activeTab === "nutrition" ? nutritionPlan : vitaminPlan;
  const tabCfg = TAB_ICONS[activeTab];
  const TabIcon = tabCfg.icon;

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
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${tabCfg.from}, ${tabCfg.to})` }}
          >
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">Fitness Hub</h1>
            <p className="text-[10px] text-slate-500">Workout · Nutrition · Vitamins</p>
          </div>
        </div>
        <button
          onClick={() => { haptic(15); setLoggedToday(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: loggedToday ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
            border: loggedToday ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: loggedToday ? "#6ee7b7" : "#94a3b8",
          }}
        >
          {loggedToday ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {loggedToday ? "Logged!" : "Log Today"}
        </button>
      </header>

      {/* Stats Row */}
      <div className="flex gap-3 px-4 pt-4 overflow-x-auto no-scrollbar">
        {[
          { label: "This Week", value: "3 sessions", color: "#f59e0b" },
          { label: "Est. Calories", value: "~1,840", color: "#ef4444" },
          { label: "Active Mins", value: "135 min", color: "#10b981" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-shrink-0 rounded-2xl px-4 py-3 flex flex-col gap-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-sm font-black text-white">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 px-4 pt-4">
        {(["workout", "nutrition", "vitamins"] as Tab[]).map((t) => {
          const cfg = TAB_ICONS[t];
          const TIcon = cfg.icon;
          const isActive = activeTab === t;
          return (
            <button
              key={t}
              onClick={() => { haptic(10); setActiveTab(t); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: isActive ? `${cfg.from}20` : "rgba(255,255,255,0.03)",
                border: isActive ? `1px solid ${cfg.from}40` : "1px solid rgba(255,255,255,0.05)",
                color: isActive ? cfg.color : "#4b5563",
              }}
            >
              <TIcon className="w-3.5 h-3.5" />{t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 overflow-y-auto no-scrollbar">

        {/* Input Card */}
        <div className="glass-card p-4 flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Configuration</h2>

          {/* Goal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400">Primary Goal</label>
            <input type="text" className="input-field py-2.5 text-xs" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>

          {/* Energy */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400">Energy Level Today</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => { haptic(10); setEnergy(lvl); }}
                  className="flex-1 py-2 rounded-xl text-base transition-all"
                  style={{
                    background: energy === lvl ? `${tabCfg.from}25` : "rgba(255,255,255,0.04)",
                    border: energy === lvl ? `1px solid ${tabCfg.from}50` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: energy === lvl ? `0 0 12px ${tabCfg.from}30` : "none",
                  }}
                >
                  {ENERGY_EMOJI[lvl - 1]}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional fields */}
          {activeTab === "workout" && (
            <div className="flex flex-col gap-1.5 animate-slide-up">
              <label className="text-[10px] text-slate-400">Available Equipment</label>
              <textarea rows={2} className="input-field py-2 text-xs" value={equipment}
                onChange={(e) => setEquipment(e.target.value)} />
            </div>
          )}
          {activeTab === "nutrition" && (
            <>
              <div className="flex flex-col gap-1.5 animate-slide-up">
                <label className="text-[10px] text-slate-400">Foods at Home</label>
                <textarea rows={2} className="input-field py-2 text-xs" value={availableFood}
                  onChange={(e) => setAvailableFood(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Meals per Day</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map((m) => (
                    <button key={m} onClick={() => { haptic(10); setMealsPerDay(m); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: mealsPerDay === m ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                        border: mealsPerDay === m ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.06)",
                        color: mealsPerDay === m ? "#6ee7b7" : "#6b7280",
                      }}
                    >{m}x</button>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeTab === "vitamins" && (
            <div className="flex flex-col gap-1.5 animate-slide-up">
              <label className="text-[10px] text-slate-400">Current Symptoms</label>
              <textarea rows={2} className="input-field py-2 text-xs" value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)} />
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={getResult}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${tabCfg.from}, ${tabCfg.to})`,
              boxShadow: `0 4px 20px ${tabCfg.from}35`,
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TabIcon className="w-4 h-4" />}
            {loading ? "Generating..." :
              activeTab === "workout" ? "Generate Workout Plan" :
              activeTab === "nutrition" ? "Plan Home Nutrition" : "Analyze Deficiencies"}
          </button>
        </div>

        {/* Result Card */}
        <div className="glass-card p-4 flex flex-col gap-3 mb-4">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">AI Generated Plan</span>
          {currentResult
            ? <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed animate-page-enter">{currentResult}</p>
            : (
              <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
                <TabIcon className="w-8 h-8 opacity-30 animate-pulse" />
                <p className="text-xs text-center">Configure your parameters and generate a personalized plan.</p>
              </div>
            )}
        </div>

      </div>
    </main>
  );
}
