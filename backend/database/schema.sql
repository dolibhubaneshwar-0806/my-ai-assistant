-- AI LifeOS Database Schema (PostgreSQL / Supabase)

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Profiles
CREATE TABLE IF NOT EXISTS memory_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    habits JSONB DEFAULT '{}',
    goals JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    weak_subjects JSONB DEFAULT '[]',
    productivity_patterns JSONB DEFAULT '{}',
    streak_data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    pdf_filename TEXT,
    pdf_text TEXT,
    summary TEXT,
    quiz JSONB DEFAULT '[]',
    revision_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness Logs
CREATE TABLE IF NOT EXISTS fitness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('workout','meal','sleep')),
    data JSONB DEFAULT '{}',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planner Events
CREATE TABLE IF NOT EXISTS planner_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIME,
    end_time TIME,
    event_date DATE DEFAULT CURRENT_DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    event_type TEXT DEFAULT 'task',
    color TEXT DEFAULT '#6366f1',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    habit TEXT NOT NULL,
    value JSONB,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger TEXT NOT NULL,
    action TEXT NOT NULL,
    action_config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'general',
    icon TEXT DEFAULT '⚡',
    last_run TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat History
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_study_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_user_date ON fitness_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_planner_user_date ON planner_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habit_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_automation_user ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id, created_at);
