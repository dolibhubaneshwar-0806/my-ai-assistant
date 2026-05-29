"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Brain, 
  Activity, 
  Calendar, 
  Zap, 
  MessageSquare, 
  ChevronRight, 
  Shield, 
  Clock, 
  Award, 
  CheckCircle2 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background glow animations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Header / Nav */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              AI LifeOS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a>
          </nav>

          <Link href="/dashboard" className="btn-primary py-2 px-4 text-xs md:text-sm">
            Launch Platform <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300 mb-6 animate-float">
          <Sparkles className="w-3.5 h-3.5" /> Next-Generation Personal AI Companion
        </div>

        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight max-w-5xl mx-auto">
          The Intelligent Digital <br/>
          <span className="gradient-text">Operating System</span> For Your Life
        </h1>

        <p className="text-base md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          AI LifeOS understands your habits, organizes study materials, schedules optimized time-blocks, designs workouts, and automates reminders into one cohesive premium workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary py-3 px-8 text-base w-full sm:w-auto justify-center">
            Enter Workspace <ChevronRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="btn-secondary py-3 px-8 text-base w-full sm:w-auto justify-center">
            Explore Capabilities
          </a>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-16 glass-card p-2 md:p-4 max-w-5xl mx-auto border-white/10 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 rounded-2xl" />
          <div className="bg-slate-950/80 rounded-xl overflow-hidden border border-white/5 aspect-[16/10] p-4 flex flex-col gap-4 text-left">
            {/* Mock layout inside dashboard */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="glass-card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-violet-400">
                  <Brain className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Study Intelligence</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-4/5 rounded bg-white/5" />
                  <div className="h-3 w-3/4 rounded bg-white/5" />
                </div>
                <div className="mt-auto h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-violet-500 rounded-full" />
                </div>
              </div>

              <div className="glass-card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Activity className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fitness & Health</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-5/6 rounded bg-white/5" />
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                </div>
                <div className="mt-auto h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-1/2 bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="glass-card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Productivity Agenda</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-white/5" />
                  <div className="h-3 w-4/5 rounded bg-white/5" />
                </div>
                <div className="mt-auto h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[85%] bg-cyan-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Five Pillars of LifeOS</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Combining study tools, fitness models, daily agenda blocks, memory stores, and smart cron alerts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Study Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload lectures or syllabus PDFs. Automatically extract summaries, generate quizzes, and predict top high-probability exam questions using Gemini API workflows.
            </p>
            <Link href="/study" className="text-violet-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Fitness & Nutrition</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive workout planners customized to equipment and daily energy scales. Get tailored meal suggestions based on home ingredients.
            </p>
            <Link href="/fitness" className="text-amber-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Daily Time-Blocking</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dynamically structure your daily hours with Pomodoros, hydration, breaks, and high-impact study sessions using a calendar engine.
            </p>
            <Link href="/planner" className="text-cyan-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-pink-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Memory Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track habits like sleep hours, screen limits, focus slots. Identify patterns of peak focus and get weekly analytics updates.
            </p>
            <Link href="/memory" className="text-pink-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Automation rules</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Set background cron notifications and alarms for hydration, bedtimes, or morning prep. Configure triggers and test them with one click.
            </p>
            <Link href="/automation" className="text-emerald-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-8 flex flex-col gap-4 border-white/5 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06] group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Interactive Copilot</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Chat with a personalized, contextual companion that references your daily parameters, saved goals, and strengths to guide you.
            </p>
            <Link href="/chat" className="text-indigo-400 text-sm font-semibold inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
              Launch Module <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-12 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-bold text-white tracking-wide">AI LifeOS © 2026</span>
          </div>
          <p className="text-xs text-slate-500">
            Powered by Google Gemini API & FastAPI backend. Designed for productivity, wellness, and discipline.
          </p>
        </div>
      </footer>
    </div>
  );
}
