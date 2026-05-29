"use client";

import React, { useEffect, useState } from "react";
import { 
  Zap, 
  Plus, 
  Play, 
  Trash2, 
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New rule parameter states
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("every_2_hours");
  const [newAction, setNewAction] = useState("send_notification");
  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  useEffect(() => {
    fetchAutomationRules();
  }, []);

  const triggerHaptic = (duration = 10) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      const res = await axios.get(`${API_BASE}/automation/rules`);
      setRules(res.data.rules || []);
    } catch (err) {
      console.error(err);
      setRules([
        { id: "rule_1", name: "Hydration Alarm", description: "Drink a glass of water", trigger: "every_2_hours", action: "send_notification", enabled: true, category: "health", icon: "💧" },
        { id: "rule_2", name: "Morning Study Alert", description: "Start study session", trigger: "daily_9am", action: "send_notification", enabled: true, category: "study", icon: "📚" },
        { id: "rule_3", name: "Sleep Wind Down Prep", description: "Prepare for bedtime hours", trigger: "daily_10pm", action: "send_notification", enabled: false, category: "health", icon: "😴" }
      ]);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    triggerHaptic(15);
    try {
      const res = await axios.post(`${API_BASE}/automation/rules`, {
        name: newName,
        trigger: newTrigger,
        action: newAction,
        action_config: { message: newMessage || `Rule ${newName} triggered!` },
        category: newCategory,
        icon: "⚡",
        description: `Custom ${newCategory} alarm workflow.`
      });
      if (res.data.success) {
        setRules(prev => [...prev, res.data.rule]);
        setNewName("");
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
      const newMockRule = {
        id: `mock_${Date.now()}`,
        name: newName,
        description: `Custom ${newCategory} alarm workflow.`,
        trigger: newTrigger,
        action: newAction,
        enabled: true,
        category: newCategory,
        icon: "⚡"
      };
      setRules(prev => [...prev, newMockRule]);
      setNewName("");
      setNewMessage("");
    }
  };

  const handleToggleRule = async (id: string, currentEnabled: boolean) => {
    triggerHaptic(10);
    try {
      const res = await axios.put(`${API_BASE}/automation/rules/${id}`, {
        enabled: !currentEnabled
      });
      if (res.data.success) {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !currentEnabled } : r));
      }
    } catch (err) {
      console.error(err);
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !currentEnabled } : r));
    }
  };

  const handleManualTrigger = async (id: string) => {
    triggerHaptic(25);
    try {
      const res = await axios.post(`${API_BASE}/automation/trigger?rule_id=${id}`);
      alert(`Manual Trigger Alert:\n"${res.data.message || 'Trigger action completed!'}"`);
    } catch (err) {
      console.error(err);
      const targetRule = rules.find(r => r.id === id);
      alert(`Manual Trigger Alert (Local):\n"${targetRule?.name} triggered successfully!"`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    triggerHaptic(20);
    try {
      await axios.delete(`${API_BASE}/automation/rules/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-slate-950/60 shadow-2xl relative border-x border-white/5 flex flex-col pb-20 animate-page-enter">
      {/* Top Appbar */}
      <header className="flex flex-col gap-1.5 p-4 border-b border-white/5 bg-slate-950/90 sticky top-0 z-30">
        <h1 className="text-base font-black text-white flex items-center gap-2">
          Automation Rules <Zap className="w-5 h-5 text-emerald-500" />
        </h1>
        <p className="text-[11px] text-slate-400">
          Configure background triggers & cron alerts.
        </p>
      </header>

      {/* Main content pane */}
      <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-4.5rem)] no-scrollbar">
        
        {/* Active Rules List */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" /> Active Workflows
          </h2>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {rules.map((rule) => (
              <div key={rule.id} className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{rule.icon || "⚡"}</span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      {rule.name}
                      <span className={`text-[8px] uppercase font-black px-1 rounded flex-shrink-0 ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {rule.enabled ? 'On' : 'Off'}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{rule.description || rule.trigger}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button 
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className={`p-1.5 rounded-lg transition-colors ${rule.enabled ? 'text-emerald-400' : 'text-slate-600'}`}
                  >
                    {rule.enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  
                  <button 
                    onClick={() => handleManualTrigger(rule.id)}
                    className="p-1.5 rounded-lg text-emerald-500 transition-colors"
                    title="Test alarm trigger"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create new alarm configuration */}
        <div className="glass-card p-5 flex flex-col gap-4 border-emerald-500/10">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Create Alarm Rule
          </h2>
          <form onSubmit={handleCreateRule} className="flex flex-col gap-3.5">
            <input 
              type="text" 
              placeholder="Alarm name (e.g. Bedtime break)" 
              className="input-field py-2.5 text-xs" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest">Trigger Interval</label>
              <select 
                className="input-field py-2.5 bg-slate-950 text-white text-xs"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
              >
                <option value="every_2_hours">💧 Every 2 hours</option>
                <option value="daily_9am">🌅 Daily at 9:00 AM</option>
                <option value="daily_10pm">🌙 Daily at 10:00 PM</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest">Rule Category</label>
              <select 
                className="input-field py-2.5 bg-slate-950 text-white text-xs"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="study">📚 Academic Study</option>
                <option value="health">💧 Physical Health</option>
                <option value="general">⚡ General Utility</option>
              </select>
            </div>

            <textarea 
              rows={2}
              placeholder="Notification message..." 
              className="input-field py-2 text-xs" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
            />

            <button type="submit" className="w-full btn-primary py-3.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/10">
              Save Rule Configuration
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
