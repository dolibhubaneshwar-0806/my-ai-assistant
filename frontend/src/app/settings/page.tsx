"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Settings, 
  User, 
  Key, 
  Clock, 
  Volume2, 
  Download, 
  Upload, 
  CheckCircle2, 
  Play, 
  Pause,
  Database,
  Sparkles,
  Info,
  Smartphone
} from "lucide-react";
import axios from "axios";
import { useAlarm } from "@/components/AlarmProvider";

const API_BASE = "http://localhost:8000/api";

type TabType = "profile" | "ai" | "alarms" | "system";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Alarms Context
  const alarmCtx = useAlarm();

  // Profile States
  const [name, setName] = useState("Operator");
  const [email, setEmail] = useState("demo@lifeos.ai");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [wakeTime, setWakeTime] = useState("06:30 AM");
  const [sleepTime, setSleepTime] = useState("11:00 PM");

  // AI Configurations
  const [activeProvider, setActiveProvider] = useState("gemini");
  const [activeModel, setActiveModel] = useState("models/gemini-1.5-flash");
  const [catalog, setCatalog] = useState<any>({});
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: "",
    groq: "",
    openrouter: "",
    ollama: "http://localhost:11434"
  });

  // Alarm custom tracks list
  const [defaultSounds, setDefaultSounds] = useState<any[]>([]);
  const [customSounds, setCustomSounds] = useState<any[]>([]);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Reminders list local triggers
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("08:00");
  const [newReminderCat, setNewReminderCat] = useState<"morning" | "study" | "fitness" | "general">("general");

  useEffect(() => {
    fetchProfileSettings();
    fetchAISettings();
    fetchAlarmSounds();
  }, []);

  const triggerHaptic = (duration = 10) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const fetchProfileSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/memory/profile`);
      const profile = res.data.profile;
      setName(profile.name || "Operator");
      setEmail(profile.email || "demo@lifeos.ai");
      setAvatarUrl(profile.avatar_url || "");
      setWakeTime(profile.habits.wake_time || "06:30 AM");
      setSleepTime(profile.habits.sleep_time || "11:00 PM");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAISettings = async () => {
    try {
      // Get specs
      const specsRes = await axios.get(`${API_BASE}/settings/models`);
      setCatalog(specsRes.data.catalog || {});

      // Get keys
      const settingsRes = await axios.get(`${API_BASE}/settings`);
      setActiveProvider(settingsRes.data.active_provider || "gemini");
      setActiveModel(settingsRes.data.active_model || "models/gemini-1.5-flash");
      // Values returned are masked by default ("...")
      setKeys(prev => ({
        ...prev,
        ...settingsRes.data.api_keys
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlarmSounds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings/alarms`);
      setDefaultSounds(res.data.defaults || []);
      setCustomSounds(res.data.custom || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    triggerHaptic(20);
    try {
      await axios.post(`${API_BASE}/memory/update`, {
        data: {
          name,
          habits: {
            wake_time: wakeTime,
            sleep_time: sleepTime
          }
        }
      });
      showSuccessAlert("Profile routine updated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // AI Settings Save
  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    triggerHaptic(20);
    try {
      await axios.post(`${API_BASE}/settings`, {
        active_provider: activeProvider,
        active_model: activeModel,
        api_keys: keys
      });
      showSuccessAlert("AI configuration updated!");
      fetchAISettings(); // reload masked keys
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger temporary success text banner
  const showSuccessAlert = (msg: string) => {
    setSuccessMsg(msg);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  // Profile Photo Upload & Client-Side Canvas Color Theme Extraction
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(15);
    setLoading(true);

    // Save file to backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/settings/upload-avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAvatarUrl(res.data.avatar_url);

      // EXTRACT PRIMARY & ACCENT COLORS from image file client-side
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          
          canvas.width = 50;
          canvas.height = 50;
          ctx.drawImage(img, 0, 0, 50, 50);
          
          const imageData = ctx.getImageData(0, 0, 50, 50).data;
          let r = 0, g = 0, b = 0, count = 0;
          
          // Sample pixels, ignoring solid whites/blacks/grays for vibrant results
          for (let i = 0; i < imageData.length; i += 4) {
            const pixelR = imageData[i];
            const pixelG = imageData[i+1];
            const pixelB = imageData[i+2];
            
            const max = Math.max(pixelR, pixelG, pixelB);
            const min = Math.min(pixelR, pixelG, pixelB);
            const diff = max - min;
            
            if (diff > 25 && max < 245 && min > 15) { // Vibrancy checker threshold
              r += pixelR;
              g += pixelG;
              b += pixelB;
              count++;
            }
          }

          // Generate default if counts are low
          if (count === 0) {
            r = 139; g = 92; b = 246; count = 1; // Indigo fallback
          }

          const avgR = Math.round(r / count);
          const avgG = Math.round(g / count);
          const avgB = Math.round(b / count);

          const rgbToHex = (red: number, green: number, blue: number) => 
            "#" + [red, green, blue].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            }).join("");

          const primaryHex = rgbToHex(avgR, avgG, avgB);
          
          // Generate complimentary Accent Color by shifting colors (e.g. swap components or shift values)
          const accentR = Math.min(255, Math.round(avgR * 0.7));
          const accentG = Math.min(255, Math.round(avgG * 1.3));
          const accentB = Math.min(255, Math.round(avgB * 1.1));
          const accentHex = rgbToHex(accentR, accentG, accentB);

          // Update root document styles instantly
          document.documentElement.style.setProperty('--dynamic-primary', primaryHex);
          document.documentElement.style.setProperty('--dynamic-accent', accentHex);
          document.documentElement.style.setProperty('--dynamic-primary-rgb', `${avgR}, ${avgG}, ${avgB}`);
          document.documentElement.style.setProperty('--dynamic-accent-rgb', `${accentR}, ${accentG}, ${accentB}`);

          // Save extracted theme variables to localStorage and backend
          const colorObj = { primary: primaryHex, accent: accentHex };
          localStorage.setItem("lifeos_theme_colors", JSON.stringify(colorObj));
          
          axios.post(`${API_BASE}/settings`, { theme_colors: colorObj });
          showSuccessAlert("Dominant theme colors extracted & applied!");
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      alert(err.response?.data?.detail || "Avatar upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // Alarm sound upload
  const handleAlarmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(15);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/settings/upload-alarm`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showSuccessAlert(`Sound '${file.name}' uploaded!`);
      setCustomSounds(res.data.sounds || []);
    } catch (err: any) {
      alert("Failed to upload audio chime.");
    } finally {
      setLoading(false);
    }
  };

  // Play/Preview sounds locally
  const handlePreviewSound = (url: string) => {
    triggerHaptic(10);
    if (playingUrl === url) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPlayingUrl(null);
      }
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(url);
      audio.play().catch(() => alert("Sound playback blocked. Double tap."));
      audioPreviewRef.current = audio;
      setPlayingUrl(url);
      audio.onended = () => setPlayingUrl(null);
    }
  };

  // Create Client Alarm reminder
  const handleAddAlarmLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    triggerHaptic(20);
    alarmCtx.addAlarm({
      name: newReminderTitle,
      time: newReminderTime,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      category: newReminderCat
    });
    setNewReminderTitle("");
    showSuccessAlert("Reminder alarm scheduled!");
  };

  // Full System backup export
  const triggerFullBackup = async () => {
    triggerHaptic(30);
    try {
      const res = await axios.get(`${API_BASE}/settings/export-all`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lifeos_full_system_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.removeChild(downloadAnchor);
      showSuccessAlert("System backup downloaded!");
    } catch (err) {
      alert("System backup compilation failed.");
    }
  };

  // Fetch model metadata card for active model
  const activeModelMeta = catalog[activeProvider]?.find((m: any) => m.id === activeModel);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-slate-950/60 shadow-2xl relative border-x border-white/5 flex flex-col pb-20 animate-page-enter">
      {/* Settings appbar */}
      <header className="flex items-center justify-between px-4 h-16 border-b border-white/5 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">System Settings</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Device OS Configuration</p>
          </div>
        </div>
      </header>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-white/5 bg-slate-950/40 sticky top-16 z-20 overflow-x-auto no-scrollbar">
        {(["profile", "ai", "alarms", "system"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { triggerHaptic(10); setActiveTab(tab); }}
            className={`flex-1 py-3.5 text-xs font-bold tracking-wider capitalize border-b-2 transition-all select-none ${
              activeTab === tab 
                ? "border-indigo-500 text-indigo-300 font-extrabold" 
                : "border-transparent text-slate-500"
            }`}
          >
            {tab === "ai" ? "AI Engine" : tab}
          </button>
        ))}
      </div>

      {/* Settings Content Screen */}
      <div className="p-4 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-8rem)] no-scrollbar">
        
        {success && (
          <div className="glass-card bg-emerald-500/10 border-emerald-500/20 p-3.5 flex items-center gap-2.5 text-emerald-300 text-xs font-bold animate-slide-up">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Profile & Theme */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-6 animate-page-enter">
            {/* Avatar setup */}
            <div className="glass-card p-5 flex flex-col items-center gap-4 text-center">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center border-2 border-white/10 shadow-lg overflow-hidden group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{name.substring(0, 2).toUpperCase()}</span>
                )}
                
                <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-bold gap-1">
                  <Upload className="w-4 h-4" /> Change Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{email}</p>
              </div>

              <div className="w-full border-t border-white/5 pt-3.5">
                <span className="text-[10px] text-slate-400 block mb-2 leading-relaxed">
                  Upload an image to dynamically extract palette tones and theme your buttons, tabs, accent tags, and background glows.
                </span>
                <label className="w-full btn-secondary text-xs cursor-pointer py-2.5">
                  <Upload className="w-4 h-4 text-slate-400" /> Upload Profile Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>

            {/* Routine preferences */}
            <form onSubmit={handleSaveProfile} className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" /> Routine Thresholds
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Operator Username</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Sleep Wake Target
                  </label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Wind Down Bedtime
                  </label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-xs mt-2">
                Save Routine Settings
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: AI Settings */}
        {activeTab === "ai" && (
          <form onSubmit={handleSaveAISettings} className="flex flex-col gap-6 animate-page-enter">
            <div className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> AI Provider Config
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Select Provider</label>
                <select
                  className="input-field bg-slate-950"
                  value={activeProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setActiveProvider(prov);
                    // Select first model of provider by default
                    if (catalog[prov] && catalog[prov].length > 0) {
                      setActiveModel(catalog[prov][0].id);
                    }
                  }}
                >
                  <option value="gemini">✨ Google Gemini</option>
                  <option value="groq">⚡ Groq LPUs</option>
                  <option value="openrouter">🪐 OpenRouter APIs</option>
                  <option value="ollama">💻 Local Ollama Offline</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Active AI Model</label>
                <select
                  className="input-field bg-slate-950"
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                >
                  {catalog[activeProvider]?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Model info card display */}
              {activeModelMeta && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2.5 text-xs animate-slide-up">
                  <div className="flex items-center gap-1 text-indigo-400 font-bold uppercase tracking-wider text-[9px]">
                    <Info className="w-3.5 h-3.5" /> Model Specifications
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed italic">
                    "{activeModelMeta.description}"
                  </p>
                  <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5 text-[10px] text-slate-400">
                    <div>Speed: <span className="text-white font-semibold">{activeModelMeta.speed}</span></div>
                    <div>Cost: <span className="text-white font-semibold">{activeModelMeta.cost}</span></div>
                    <div className="col-span-2">Context Window: <span className="text-white font-semibold">{activeModelMeta.context}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Keys settings */}
            <div className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> API Authentication Tokens
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">Google Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy... (Masked if saved)"
                    className="input-field font-mono text-xs"
                    value={keys.gemini}
                    onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">Groq API Key</label>
                  <input
                    type="password"
                    placeholder="gsk_... (Masked if saved)"
                    className="input-field font-mono text-xs"
                    value={keys.groq}
                    onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">OpenRouter API Key</label>
                  <input
                    type="password"
                    placeholder="sk-or-... (Masked if saved)"
                    className="input-field font-mono text-xs"
                    value={keys.openrouter}
                    onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">Local Ollama API Endpoint</label>
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    className="input-field font-mono text-xs"
                    value={keys.ollama}
                    onChange={(e) => setKeys({ ...keys, ollama: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-xs mt-2">
                Save AI Configuration
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Alarms & Sounds */}
        {activeTab === "alarms" && (
          <div className="flex flex-col gap-6 animate-page-enter">
            {/* Alarm Sounds management */}
            <div className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Volume2 className="w-4.5 h-4.5 text-indigo-400" /> Routine Alert Sounds
              </h3>

              <div className="flex flex-col gap-2">
                <label className="w-full btn-secondary text-xs cursor-pointer py-3.5 border-dashed border-white/10 hover:border-indigo-500/30">
                  <Upload className="w-4 h-4 text-slate-400" /> Upload Custom Alarm (.mp3)
                  <input type="file" className="hidden" accept="audio/*" onChange={handleAlarmUpload} />
                </label>
              </div>

              {/* Lists of sounds */}
              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Select & Preview Sound tracks</span>
                
                {/* Defaults */}
                {defaultSounds.map((sound) => (
                  <div key={sound.url} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                    <span className="font-semibold text-slate-300">{sound.name}</span>
                    <button 
                      onClick={() => handlePreviewSound(sound.url)}
                      className={`p-2 rounded-xl transition-all ${playingUrl === sound.url ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-slate-400 hover:text-white"}`}
                    >
                      {playingUrl === sound.url ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                ))}

                {/* Custom list */}
                {customSounds.length > 0 && (
                  <div className="flex flex-col gap-2.5 mt-2 border-t border-white/5 pt-3">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Custom Audio Uploads</span>
                    {customSounds.map((sound) => (
                      <div key={sound.url} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs animate-slide-up">
                        <span className="font-semibold text-slate-300">{sound.name}</span>
                        <button 
                          onClick={() => handlePreviewSound(sound.url)}
                          className={`p-2 rounded-xl transition-all ${playingUrl === sound.url ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-slate-400 hover:text-white"}`}
                        >
                          {playingUrl === sound.url ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Schedule new reminder alarm */}
            <form onSubmit={handleAddAlarmLocal} className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Create Reminders Alarm
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400">Routine Description / Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Break and Hydrate water" 
                  className="input-field"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">Trigger Time</label>
                  <input 
                    type="time" 
                    className="input-field text-xs"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400">Category Tag</label>
                  <select
                    className="input-field text-xs bg-slate-950 py-3.5"
                    value={newReminderCat}
                    onChange={(e: any) => setNewReminderCat(e.target.value)}
                  >
                    <option value="morning">🌅 Morning Alarm</option>
                    <option value="study">📚 Study Alert</option>
                    <option value="fitness">🏋️ Fitness Timer</option>
                    <option value="general">⚡ General Alert</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-3 text-xs mt-2">
                Schedule Routine Alarm
              </button>
            </form>

            {/* Alarm lists active display */}
            <div className="glass-card p-5 flex flex-col gap-3">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Scheduled Reminders List</h4>
              {alarmCtx.alarms.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">No active reminders configured.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {alarmCtx.alarms.map((alarm) => (
                    <div key={alarm.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{alarm.name}</div>
                        <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5">{alarm.time} • {alarm.category}</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Toggle switch */}
                        <button
                          onClick={() => { triggerHaptic(10); alarmCtx.toggleAlarm(alarm.id); }}
                          className={`w-10 h-5.5 rounded-full p-0.5 transition-all ${alarm.enabled ? "bg-indigo-600 flex justify-end" : "bg-white/10 flex justify-start"}`}
                        >
                          <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md block" />
                        </button>

                        <button 
                          onClick={() => { triggerHaptic(15); alarmCtx.deleteAlarm(alarm.id); }}
                          className="text-slate-500 hover:text-red-400 text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: System & Backups */}
        {activeTab === "system" && (
          <div className="flex flex-col gap-6 animate-page-enter">
            {/* System Info */}
            <div className="glass-card p-5 flex flex-col gap-3 text-xs leading-relaxed">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" /> Application Details
              </h3>
              <p className="text-slate-400">
                AI LifeOS is configured as a fully installable Progressive Web App (PWA). If running on Android/Chrome, tap "Add to Home Screen" inside browser options to enable the standalone launcher icon, offline screens, and native push notifications.
              </p>
              <div className="border-t border-white/5 pt-2.5 text-[10px] text-slate-500 grid grid-cols-2 gap-1.5">
                <div>Framework: Next.js v14.2</div>
                <div>Runtime: FastAPI & Python</div>
                <div>Offline Support: Active SW</div>
                <div>Theme Engine: Dynamic HSL</div>
              </div>
            </div>

            {/* System exports */}
            <div className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Data Management
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export a full backup of your AI assistant data. The generated file includes your memory profile configurations, saved habits, weekly summary values, planner routines, and multi-turn chat logs.
              </p>

              <button 
                onClick={triggerFullBackup}
                className="w-full btn-secondary text-xs py-3.5 flex items-center justify-center gap-2 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10"
              >
                <Download className="w-4.5 h-4.5 text-indigo-400" /> Backup System Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
