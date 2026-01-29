-- Run this in your Supabase SQL Editor to create the missing users table

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,           -- Can be UUID or text, matching Profile ID
    clerk_user_id TEXT UNIQUE,     -- Essential for Middleware checks
    email TEXT,
    name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow read access (or customize as needed)
CREATE POLICY "Allow read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow service role full access" ON public.users FOR ALL USING (true) WITH CHECK (true);
