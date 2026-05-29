"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface Alarm {
  id: string;
  name: string;
  time: string; // "HH:MM" 24h format
  days: string[]; // ["Mon", "Tue", ...]
  enabled: boolean;
  category: "morning" | "study" | "fitness" | "general";
  soundUrl?: string;
  lastFiredDate?: string; // "YYYY-MM-DD"
}

interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, "id" | "enabled">) => void;
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;
  triggerAlarmTest: (name: string, soundUrl?: string) => void;
  activeTriggeredAlarm: Alarm | null;
  snoozeAlarm: () => void;
  dismissAlarm: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [activeTriggeredAlarm, setActiveTriggeredAlarm] = useState<Alarm | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const vibrationIntervalRef = useRef<any>(null);

  // Load alarms from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lifeos_alarms");
    if (saved) {
      try {
        setAlarms(JSON.parse(saved));
      } catch (e) {
        setAlarms(getDefaultAlarms());
      }
    } else {
      const defaults = getDefaultAlarms();
      setAlarms(defaults);
      localStorage.setItem("lifeos_alarms", JSON.stringify(defaults));
    }

    // Request notification permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const getDefaultAlarms = (): Alarm[] => [
    { id: "a1", name: "Rise & Shine Routine", time: "06:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], enabled: true, category: "morning" },
    { id: "a2", name: "Deep Study Revision Block", time: "09:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], enabled: true, category: "study" },
    { id: "a3", name: "Fitness Workout Timer", time: "15:30", days: ["Mon", "Wed", "Fri"], enabled: false, category: "fitness" },
  ];

  const saveAlarms = (newAlarms: Alarm[]) => {
    setAlarms(newAlarms);
    localStorage.setItem("lifeos_alarms", JSON.stringify(newAlarms));
  };

  // Add, toggle, delete alarms
  const addAlarm = (alarmData: Omit<Alarm, "id" | "enabled">) => {
    const newAlarm: Alarm = {
      ...alarmData,
      id: "alarm_" + Date.now(),
      enabled: true
    };
    saveAlarms([...alarms, newAlarm]);
  };

  const toggleAlarm = (id: string) => {
    saveAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    saveAlarms(alarms.filter(a => a.id !== id));
  };

  // Rhythmic Audio Synth (Fallback when audio tracks aren't configured/loaded)
  const startSynthAlarm = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      let tick = 0;
      synthIntervalRef.current = setInterval(() => {
        if (!ctx || ctx.state === "closed") return;
        
        // Dynamic synth melody
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5 arpeggio
        osc.frequency.value = notes[tick % notes.length];
        osc.type = "sine";

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        tick++;
      }, 400);
    } catch (e) {
      console.error("Audio Synthesis error", e);
    }
  };

  // Stop custom sound / synthesis
  const stopAudio = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current = null;
    }
  };

  // Rhythmic Haptic Vibration
  const startVibration = () => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      vibrationIntervalRef.current = setInterval(() => {
        window.navigator.vibrate([200, 100, 200, 100, 400]); // Material standard rhythm
      }, 1500);
    }
  };

  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(0); // Cancel ongoing
    }
  };

  // Alarm Trigger
  const triggerAlarm = (alarm: Alarm) => {
    setActiveTriggeredAlarm(alarm);
    startVibration();

    // Try playing actual sound file if exists
    if (alarm.soundUrl) {
      try {
        const audio = new Audio(alarm.soundUrl);
        audio.loop = true;
        audio.play().catch(() => {
          // Fallback to web synth if playback is blocked by browser interaction controls
          startSynthAlarm();
        });
        audioObjRef.current = audio;
      } catch (err) {
        startSynthAlarm();
      }
    } else {
      startSynthAlarm();
    }

    // Trigger local push notification banner
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(`⏰ LifeOS: ${alarm.name}`, {
        body: `Your scheduled ${alarm.category} routine is active!`,
        icon: "/favicon.ico",
        requireInteraction: true
      });
    }
  };

  // Manual Trigger Test
  const triggerAlarmTest = (name: string, soundUrl?: string) => {
    const testAlarm: Alarm = {
      id: "test_" + Date.now(),
      name: name + " (Test)",
      time: "00:00",
      days: [],
      enabled: true,
      category: "general",
      soundUrl
    };
    triggerAlarm(testAlarm);
  };

  const snoozeAlarm = () => {
    stopAudio();
    stopVibration();
    setActiveTriggeredAlarm(null);

    // Re-schedule alarm in 5 minutes
    if (activeTriggeredAlarm) {
      const now = new Date();
      const minutesFuture = new Date(now.getTime() + 5 * 60 * 1000);
      const hStr = String(minutesFuture.getHours()).padStart(2, "0");
      const mStr = String(minutesFuture.getMinutes()).padStart(2, "0");
      
      const snoozedAlarm: Alarm = {
        ...activeTriggeredAlarm,
        id: "snooze_" + Date.now(),
        name: `${activeTriggeredAlarm.name} (Snoozed)`,
        time: `${hStr}:${mStr}`,
        enabled: true
      };
      // Temporary add
      setAlarms(prev => [...prev, snoozedAlarm]);
    }
  };

  const dismissAlarm = () => {
    stopAudio();
    stopVibration();
    
    // Clear snooze temporary alarms
    if (activeTriggeredAlarm && activeTriggeredAlarm.id.startsWith("snooze_")) {
      setAlarms(prev => prev.filter(a => a.id !== activeTriggeredAlarm.id));
    }
    
    setActiveTriggeredAlarm(null);
  };

  // Time-Checking Loop (Runs every 10 seconds to detect triggers)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[now.getDay()];
      const todayDateStr = now.toISOString().split("T")[0];

      // Check if alarm time matches
      alarms.forEach(alarm => {
        if (
          alarm.enabled &&
          alarm.time === currentHHMM &&
          (alarm.days.length === 0 || alarm.days.includes(currentDay)) &&
          alarm.lastFiredDate !== todayDateStr &&
          activeTriggeredAlarm?.id !== alarm.id
        ) {
          // Trigger alarm!
          alarm.lastFiredDate = todayDateStr;
          triggerAlarm(alarm);
          // Sync update
          saveAlarms(alarms.map(a => a.id === alarm.id ? { ...a, lastFiredDate: todayDateStr } : a));
        }
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [alarms, activeTriggeredAlarm]);

  return (
    <AlarmContext.Provider value={{
      alarms,
      addAlarm,
      toggleAlarm,
      deleteAlarm,
      triggerAlarmTest,
      activeTriggeredAlarm,
      snoozeAlarm,
      dismissAlarm
    }}>
      {children}

      {/* Modern Material Design 3 Fullscreen Alarm Overlay */}
      {activeTriggeredAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 select-none animate-page-enter">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
          
          <div className="w-full max-w-[360px] flex flex-col items-center justify-center text-center gap-8 relative">
            {/* Pulsing Alarm Bell representation */}
            <div className="w-24 h-24 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center relative pulse-active">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl">
                🔔
              </div>
            </div>

            <div>
              <span className="badge badge-purple uppercase tracking-widest text-[10px] mb-2">
                Active {activeTriggeredAlarm.category} alert
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                {activeTriggeredAlarm.name}
              </h2>
              <p className="text-indigo-300 font-black text-4xl tracking-wide font-mono mt-3">
                {activeTriggeredAlarm.time}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full mt-6">
              <button 
                onClick={dismissAlarm}
                className="w-full btn-primary py-4 text-sm font-extrabold"
              >
                Dismiss Alarm
              </button>
              <button 
                onClick={snoozeAlarm}
                className="w-full btn-secondary py-3.5 text-xs font-bold text-indigo-300 border-indigo-500/20"
              >
                Snooze (5 mins)
              </button>
            </div>
          </div>
        </div>
      )}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error("useAlarm must be used within AlarmProvider");
  }
  return context;
}
