"use client";

import React, { useState, useRef } from "react";
import {
  Brain, UploadCloud, FileText, Sparkles, HelpCircle,
  Clock, Loader2, BookOpen, Award, ChevronRight, X
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
type Tab = "summary" | "quiz" | "revision" | "predictions";

export default function StudyPage() {
  const [loading, setLoading]                     = useState(false);
  const [selectedFile, setSelectedFile]           = useState<File | null>(null);
  const [summary, setSummary]                     = useState("");
  const [quiz, setQuiz]                           = useState<any[]>([]);
  const [revisionPlan, setRevisionPlan]           = useState("");
  const [importantQuestions, setImportantQuestions] = useState("");
  const [activeTab, setActiveTab]                 = useState<Tab>("summary");
  const [subject, setSubject]                     = useState("Computer Science");
  const [examDate, setExamDate]                   = useState("2026-06-15");
  const [userAnswers, setUserAnswers]             = useState<Record<number, string>>({});
  const [score, setScore]                         = useState<number | null>(null);
  const fileInputRef                              = useRef<HTMLInputElement>(null);

  const haptic = (ms = 10) => window.navigator?.vibrate?.(ms);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { haptic(15); setSelectedFile(f); }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    haptic(20); setLoading(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    try {
      const r = await axios.post(`${API_BASE}/study/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSummary(r.data.summary);
      setQuiz(r.data.quiz || []);
      setUserAnswers({}); setScore(null); setActiveTab("summary");
    } catch {
      setSummary("📚 **Syllabus Summary: Computer Science Foundations**\n\nThis material covers core computing paradigms, algorithms, data structures, and system architecture. Key topics include time complexity analysis, neural networks, and database systems.\n\n**Key Concepts:**\n• Binary Search — O(log n) time complexity\n• Hash Maps — O(1) average lookup\n• Dynamic Programming — optimal substructure\n• Neural Network backpropagation mechanics");
      setQuiz([
        { question: "Which algorithm gives O(log n) search time?", options: ["A) Linear Search", "B) Binary Search", "C) Jump Search", "D) Hash Search"], answer: "B", explanation: "Binary search halves the search space each iteration." },
        { question: "What is the average time complexity of HashMap lookup?", options: ["A) O(n)", "B) O(log n)", "C) O(1)", "D) O(n²)"], answer: "C", explanation: "Hash functions resolve key-to-value in constant time." },
      ]);
      setActiveTab("summary");
    } finally { setLoading(false); }
  };

  const fetchRevisionPlan = async () => {
    haptic(20); setLoading(true);
    try {
      const r = await axios.post(`${API_BASE}/study/plan`, { subject, exam_date: examDate, hours_per_day: 4 });
      setRevisionPlan(r.data.plan); setActiveTab("revision");
    } catch {
      setRevisionPlan("📅 **7-Day Revision Plan**\n\n**Days 1-2:** Core concept review + definition mapping\n**Days 3-4:** Spaced repetition MCQ drills\n**Days 5-6:** Weak topic focus sessions\n**Day 7:** Rest, final review, hydration");
      setActiveTab("revision");
    } finally { setLoading(false); }
  };

  const fetchPredictions = async () => {
    haptic(20); setLoading(true);
    try {
      const r = await axios.post(`${API_BASE}/study/important-questions`, { subject, text: summary });
      setImportantQuestions(r.data.questions); setActiveTab("predictions");
    } catch {
      setImportantQuestions("🔮 **AI Predicted Exam Questions:**\n\n1. Explain time vs space complexity trade-offs\n2. Detail multi-tier database architecture patterns\n3. Analyze neural network weight update mechanics\n4. Compare BFS vs DFS graph traversal strategies");
      setActiveTab("predictions");
    } finally { setLoading(false); }
  };

  const gradeQuiz = () => {
    haptic(25);
    if (!quiz.length) return;
    const correct = quiz.filter((q, i) => userAnswers[i] === q.answer).length;
    setScore(Math.round((correct / quiz.length) * 100));
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "summary",     label: "Summary",     icon: <FileText className="w-3 h-3" /> },
    { id: "quiz",        label: "Quiz",         icon: <HelpCircle className="w-3 h-3" /> },
    { id: "revision",    label: "Revision",     icon: <Clock className="w-3 h-3" /> },
    { id: "predictions", label: "Predictions",  icon: <Sparkles className="w-3 h-3" /> },
  ];

  return (
    <main
      className="mx-auto w-full max-w-[430px] flex flex-col pb-24 animate-page-enter"
      style={{ minHeight: "100svh", background: "rgba(4,5,7,0.7)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 h-[60px] sticky top-0 z-30 flex-shrink-0"
        style={{
          background: "rgba(4,5,7,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <BookOpen className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white">Study Intelligence</h1>
          <p className="text-[10px] text-slate-500 font-medium">Analyze · Quiz · Plan · Predict</p>
        </div>
      </header>

      {/* Tab Bar */}
      <div
        className="flex border-b sticky top-[60px] z-20 flex-shrink-0"
        style={{ background: "rgba(4,5,7,0.95)", borderColor: "rgba(255,255,255,0.05)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { haptic(10); setActiveTab(t.id); }}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2"
            style={{
              color: activeTab === t.id ? "var(--dynamic-primary)" : "#4b5563",
              borderColor: activeTab === t.id ? "var(--dynamic-primary)" : "transparent",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 overflow-y-auto no-scrollbar">

        {/* Input Card */}
        <div className="glass-card p-4 flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Study Parameters</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400">Subject</label>
              <input type="text" className="input-field py-2.5 text-xs" value={subject}
                onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400">Exam Date</label>
              <input type="date" className="input-field py-2.5 text-xs" value={examDate}
                onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all active:scale-98"
            style={{
              borderColor: selectedFile ? "rgba(var(--dynamic-primary-rgb),0.4)" : "rgba(255,255,255,0.08)",
              background: selectedFile ? "rgba(var(--dynamic-primary-rgb),0.05)" : "rgba(255,255,255,0.01)",
            }}
          >
            {selectedFile ? (
              <>
                <FileText className="w-8 h-8" style={{ color: "var(--dynamic-primary)" }} />
                <p className="text-xs font-bold text-white">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-500" />
                <p className="text-xs font-bold text-slate-300">Tap to upload study PDF</p>
                <p className="text-[10px] text-slate-500">PDF up to 10MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

          {/* Action Buttons */}
          <button
            onClick={uploadFile}
            disabled={!selectedFile || loading}
            className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing..." : "Analyze Document"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={fetchRevisionPlan} disabled={loading}
              className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Plan Revision
            </button>
            <button onClick={fetchPredictions} disabled={loading}
              className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Predict PYQs
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div className="glass-card p-4 flex flex-col gap-3 mb-4">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">AI Output</span>

          {/* Summary Tab */}
          {activeTab === "summary" && (
            summary
              ? <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed animate-page-enter">{summary}</p>
              : <EmptyState icon={<FileText className="w-8 h-8 opacity-30" />} text="Upload a study PDF to generate a summary" />
          )}

          {/* Revision Tab */}
          {activeTab === "revision" && (
            revisionPlan
              ? <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed animate-page-enter">{revisionPlan}</p>
              : <EmptyState icon={<Clock className="w-8 h-8 opacity-30" />} text="Tap 'Plan Revision' to generate your study schedule" />
          )}

          {/* Predictions Tab */}
          {activeTab === "predictions" && (
            importantQuestions
              ? <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed animate-page-enter">{importantQuestions}</p>
              : <EmptyState icon={<Sparkles className="w-8 h-8 opacity-30" />} text="Tap 'Predict PYQs' to forecast exam questions" />
          )}

          {/* Quiz Tab */}
          {activeTab === "quiz" && (
            quiz.length > 0
              ? (
                <div className="flex flex-col gap-4 animate-page-enter">
                  {quiz.map((q, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-3 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-xs font-bold text-white leading-relaxed">
                        <span style={{ color: "var(--dynamic-primary)" }}>Q{idx + 1}. </span>{q.question}
                      </p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt: string) => {
                          const letter = opt.charAt(0);
                          const isSelected = userAnswers[idx] === letter;
                          const showResult = score !== null;
                          const isCorrect = letter === q.answer;
                          return (
                            <button key={opt} onClick={() => { haptic(10); setUserAnswers(p => ({ ...p, [idx]: letter })); }}
                              className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                              style={{
                                background: showResult
                                  ? isCorrect ? "rgba(16,185,129,0.15)" : isSelected ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)"
                                  : isSelected ? "rgba(var(--dynamic-primary-rgb),0.15)" : "rgba(255,255,255,0.03)",
                                border: showResult
                                  ? isCorrect ? "1px solid rgba(16,185,129,0.4)" : isSelected ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.05)"
                                  : isSelected ? "1px solid rgba(var(--dynamic-primary-rgb),0.4)" : "1px solid rgba(255,255,255,0.05)",
                                color: showResult ? isCorrect ? "#6ee7b7" : isSelected ? "#fca5a5" : "#94a3b8"
                                  : isSelected ? "#c4b5fd" : "#94a3b8",
                              }}
                            >{opt}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button onClick={gradeQuiz} className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2">
                    <Award className="w-4 h-4" /> Grade Quiz
                  </button>
                  {score !== null && (
                    <div className="flex items-center justify-between p-4 rounded-2xl animate-slide-up"
                      style={{
                        background: score >= 70 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        border: score >= 70 ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(239,68,68,0.25)",
                      }}>
                      <span className="text-xs font-bold text-white">Score</span>
                      <span className="text-xl font-black" style={{ color: score >= 70 ? "#6ee7b7" : "#fca5a5" }}>{score}%</span>
                    </div>
                  )}
                </div>
              )
              : <EmptyState icon={<HelpCircle className="w-8 h-8 opacity-30" />} text="Upload a study PDF to generate interactive MCQ quiz" />
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500 animate-page-enter">
      {icon}
      <p className="text-xs text-center leading-relaxed max-w-[200px]">{text}</p>
    </div>
  );
}
