-- Profiles table to store user fitness data
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    age INT,
    gender TEXT,
    height FLOAT,
    weight FLOAT,
    fitness_level TEXT,
    training_experience TEXT,
    available_equipment TEXT,
    training_location TEXT,
    injuries TEXT,
    diet_type TEXT,
    daily_schedule TEXT,
    sleep_hours FLOAT,
    stress_level TEXT,
    goal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    plan_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nutrition Plans table
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    plan_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Progress Logs table
CREATE TABLE IF NOT EXISTS public.progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    weight FLOAT,
    measurements JSONB,
    strength_metrics JSONB,
    mood TEXT,
    energy_level TEXT,
    body_fat_estimate FLOAT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
