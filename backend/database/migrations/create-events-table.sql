-- Create events table for college events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue TEXT NOT NULL,
    club_name TEXT, -- Name of the club organizing the event
    organizer TEXT,
    guests TEXT, -- Comma-separated list of special guests
    category TEXT NOT NULL, -- Technical, Cultural, Sports, Workshops, etc.
    image_url TEXT,
    max_capacity INTEGER,
    registration_required BOOLEAN DEFAULT false,
    registration_link TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, ongoing, completed, cancelled
    created_by TEXT, -- Admin username who created the event
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);

-- Enable RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view events (public access for SELECT)
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT USING (true);

-- Policy: Allow insert/update/delete from service role (your API will handle admin authentication)
CREATE POLICY "Service role can manage events" ON events
    FOR ALL USING (true);
