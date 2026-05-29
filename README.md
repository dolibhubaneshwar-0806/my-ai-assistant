# AI LifeOS — Personal AI Operating System

AI LifeOS is an intelligent personal productivity ecosystem that helps users manage study materials, health, workouts, time-blocks, and personalized routine automation in a unified interface. It combines a dynamic dashboard, full custom chatbot companion, automated schedulers, and memory insights.

---

## 🚀 Key Modules & Capabilities

1. 📚 **Study Intelligence** — Custom PDF syllabi analytics, MCQ quiz engine, PYQ question predicting, daily/weekly exam revision schedules.
2. 🏋️ **Fitness & Health Hub** — Home-cooking nutrition planners, dynamic energy-adaptive fitness cards, recovery advice, vitamin deficiency support.
3. 📅 **Time-Block Planner** — Automatic daily hourly scheduler using active constraints (Pomodoro, wake/sleep target timers), Eisenhower priorities.
4. 🧠 **AI Memory Engine** — User habit tracker logs (focus, sleep, hydration), daily activity streak charts, weekly memory insights advice.
5. ⚡ **Automation Workflows** — Custom trigger alarms (hydration, rest blocks, deep-focus pomodoros) connected to APScheduler timers.

---

## 🛠️ Architecture Structure

```text
                    ┌──────────────────────┐
                    │      Frontend UI     │
                    │  Next.js + Tailwind  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      API Gateway     │
                    │      FastAPI         │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│ AI Study Module│   │ Fitness Module │   │ Planner Module │
└────────────────┘   └────────────────┘   └────────────────┘
         ▼                     ▼                     ▼
┌────────────────────────────────────────────────────┐
│               AI Decision Engine                  │
│      Gemini API + LangChain + Memory             │
└────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Memory Database   │
                    │ Supabase/PostgreSQL  │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Automation Scheduler │
                    │ Cron + Redis Queue   │
                    └──────────────────────┘
```

---

## 💻 Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, Framer Motion, Lucide icons, Recharts metrics.
- **Backend**: FastAPI (Python), APScheduler background tasks, PyPDF2 parser.
- **AI Core**: Google Gemini API, LangChain (Memory), LangGraph (Agentic Workflows), In-Memory Semantic Search RAG.
- **Database**: PostgreSQL / Supabase, SQL storage schemas.

---

## ⚙️ Quick Start Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker & Docker Compose (Optional)

### Environment Settings
Create a `.env` in `backend/` mirroring the `.env.example`:
```env
GEMINI_API_KEY=AIzaSy...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

### Manual Development Setup

1. **Run Backend Services**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

2. **Run Frontend Interface**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the LifeOS Dashboard.

---

## 🐳 Docker Deployment

To spin up the entire database, Redis cache, FastAPI server, and Next.js frontend in one command:
```bash
docker-compose up --build
```
