-- Run2Rank Database Schema
-- SQLite Database Schema matching Supabase structure

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    username TEXT,
    avatar_url TEXT,
    pincode TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_pincode ON profiles(pincode);

-- Runs Table
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    pincode TEXT NOT NULL,
    distance_meters REAL NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    path_coordinates TEXT NOT NULL DEFAULT '[]',
    territory_polygon TEXT DEFAULT '[]',
    started_at TEXT NOT NULL,
    ended_at TEXT,
    is_valid INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_pincode ON runs(pincode);
CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at);
CREATE INDEX IF NOT EXISTS idx_runs_is_valid ON runs(is_valid);

-- Health Data Table
CREATE TABLE IF NOT EXISTS health_data (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    height_cm REAL,
    weight_kg REAL,
    age INTEGER,
    gender TEXT,
    activity_level TEXT,
    daily_steps_goal INTEGER DEFAULT 10000,
    daily_calories_goal INTEGER,
    bmi REAL,
    bmr REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);

-- Monthly Stats Table
CREATE TABLE IF NOT EXISTS monthly_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    pincode TEXT NOT NULL,
    year_month TEXT NOT NULL,
    total_distance_meters REAL NOT NULL DEFAULT 0,
    total_duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_runs INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, pincode, year_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_stats_pincode_month ON monthly_stats(pincode, year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    pincode TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    is_running INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_presence_pincode ON user_presence(pincode);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_profiles_timestamp 
AFTER UPDATE ON profiles
BEGIN
    UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_health_data_timestamp 
AFTER UPDATE ON health_data
BEGIN
    UPDATE health_data SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to calculate BMI and BMR on health_data insert/update
CREATE TRIGGER IF NOT EXISTS calculate_health_metrics_insert
AFTER INSERT ON health_data
WHEN NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL
BEGIN
    UPDATE health_data 
    SET 
        bmi = ROUND(NEW.weight_kg / ((NEW.height_cm / 100.0) * (NEW.height_cm / 100.0)), 2),
        bmr = CASE 
            WHEN NEW.gender = 'male' AND NEW.age IS NOT NULL THEN 
                ROUND(88.362 + (13.397 * NEW.weight_kg) + (4.799 * NEW.height_cm) - (5.677 * NEW.age), 2)
            WHEN NEW.gender = 'female' AND NEW.age IS NOT NULL THEN 
                ROUND(447.593 + (9.247 * NEW.weight_kg) + (3.098 * NEW.height_cm) - (4.330 * NEW.age), 2)
            ELSE bmr
        END
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS calculate_health_metrics_update
AFTER UPDATE ON health_data
WHEN NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL
BEGIN
    UPDATE health_data 
    SET 
        bmi = ROUND(NEW.weight_kg / ((NEW.height_cm / 100.0) * (NEW.height_cm / 100.0)), 2),
        bmr = CASE 
            WHEN NEW.gender = 'male' AND NEW.age IS NOT NULL THEN 
                ROUND(88.362 + (13.397 * NEW.weight_kg) + (4.799 * NEW.height_cm) - (5.677 * NEW.age), 2)
            WHEN NEW.gender = 'female' AND NEW.age IS NOT NULL THEN 
                ROUND(447.593 + (9.247 * NEW.weight_kg) + (3.098 * NEW.height_cm) - (4.330 * NEW.age), 2)
            ELSE bmr
        END
    WHERE id = NEW.id;
END;

-- Trigger to update monthly_stats when a run is inserted
CREATE TRIGGER IF NOT EXISTS update_monthly_stats_on_run_insert
AFTER INSERT ON runs
WHEN NEW.is_valid = 1
BEGIN
    INSERT INTO monthly_stats (user_id, pincode, year_month, total_distance_meters, total_duration_seconds, total_runs)
    VALUES (
        NEW.user_id, 
        NEW.pincode, 
        strftime('%Y-%m', NEW.started_at),
        NEW.distance_meters,
        NEW.duration_seconds,
        1
    )
    ON CONFLICT(user_id, pincode, year_month) 
    DO UPDATE SET
        total_distance_meters = total_distance_meters + NEW.distance_meters,
        total_duration_seconds = total_duration_seconds + NEW.duration_seconds,
        total_runs = total_runs + 1,
        updated_at = datetime('now');
END;
