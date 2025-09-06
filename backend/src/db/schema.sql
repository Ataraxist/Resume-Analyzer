-- O*NET Data Cache Schema

-- Main occupations table
CREATE TABLE IF NOT EXISTS occupations (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    sample_titles TEXT,
    bright_outlook BOOLEAN DEFAULT 0,
    rapid_growth BOOLEAN DEFAULT 0,
    numerous_openings BOOLEAN DEFAULT 0,
    updated_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    task_id TEXT,
    task_text TEXT NOT NULL,
    incumbents_responding REAL,
    date_updated TEXT,
    domain_source TEXT,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, task_id)
);

-- Technology skills table
CREATE TABLE IF NOT EXISTS technology_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    skill_id TEXT,
    skill_name TEXT NOT NULL,
    skill_description TEXT,
    example TEXT,
    hot_technology BOOLEAN DEFAULT 0,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, skill_id)
);

-- Tools used table
CREATE TABLE IF NOT EXISTS tools_used (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    tool_id TEXT,
    tool_name TEXT NOT NULL,
    tool_description TEXT,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, tool_id)
);

-- Work activities table
CREATE TABLE IF NOT EXISTS work_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    activity_id TEXT,
    activity_name TEXT NOT NULL,
    activity_description TEXT,
    importance_score REAL,
    level_score REAL,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, activity_id)
);

-- Knowledge table
CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    knowledge_id TEXT,
    knowledge_name TEXT NOT NULL,
    knowledge_description TEXT,
    importance_score REAL,
    level_score REAL,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, knowledge_id)
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    skill_id TEXT,
    skill_name TEXT NOT NULL,
    skill_description TEXT,
    importance_score REAL,
    level_score REAL,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, skill_id)
);

-- Abilities table
CREATE TABLE IF NOT EXISTS abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    ability_id TEXT,
    ability_name TEXT NOT NULL,
    ability_description TEXT,
    importance_score REAL,
    level_score REAL,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code, ability_id)
);

-- Education requirements table
CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    category TEXT NOT NULL,
    percentage REAL,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code)
);

-- Job zones table
CREATE TABLE IF NOT EXISTS job_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    job_zone INTEGER,
    education_needed TEXT,
    related_experience TEXT,
    on_the_job_training TEXT,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code)
);

-- Fetch metadata table to track sync status
CREATE TABLE IF NOT EXISTS fetch_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_code TEXT NOT NULL,
    fetch_status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
    fetch_started_at TIMESTAMP,
    fetch_completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (occupation_code) REFERENCES occupations(code),
    UNIQUE(occupation_code)
);

-- System metadata table
CREATE TABLE IF NOT EXISTS system_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_occupation ON tasks(occupation_code);
CREATE INDEX IF NOT EXISTS idx_technology_skills_occupation ON technology_skills(occupation_code);
CREATE INDEX IF NOT EXISTS idx_tools_used_occupation ON tools_used(occupation_code);
CREATE INDEX IF NOT EXISTS idx_work_activities_occupation ON work_activities(occupation_code);
CREATE INDEX IF NOT EXISTS idx_knowledge_occupation ON knowledge(occupation_code);
CREATE INDEX IF NOT EXISTS idx_skills_occupation ON skills(occupation_code);
CREATE INDEX IF NOT EXISTS idx_abilities_occupation ON abilities(occupation_code);
CREATE INDEX IF NOT EXISTS idx_education_occupation ON education(occupation_code);
CREATE INDEX IF NOT EXISTS idx_job_zones_occupation ON job_zones(occupation_code);
CREATE INDEX IF NOT EXISTS idx_fetch_metadata_status ON fetch_metadata(fetch_status);

-- Resumes table for Phase 2
CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    raw_text TEXT NOT NULL,
    structured_data TEXT, -- JSON string containing parsed resume data
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(processing_status);
CREATE INDEX IF NOT EXISTS idx_resumes_created ON resumes(created_at);

-- Analyses table for Phase 3
CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    occupation_code TEXT NOT NULL,
    occupation_title TEXT NOT NULL,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_fit_score REAL,
    dimension_scores TEXT, -- JSON with per-dimension scores
    detailed_gaps TEXT, -- JSON with specific missing items
    recommendations TEXT, -- JSON with improvement suggestions
    processing_time_ms INTEGER,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (occupation_code) REFERENCES occupations(code)
);

-- Create indexes for analyses table
CREATE INDEX IF NOT EXISTS idx_analyses_resume ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_analyses_occupation ON analyses(occupation_code);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_date ON analyses(analysis_date);

-- Insert initial system metadata
INSERT OR REPLACE INTO system_metadata (key, value) VALUES ('schema_version', '1.2.0');
INSERT OR REPLACE INTO system_metadata (key, value) VALUES ('last_full_sync', NULL);