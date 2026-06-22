-- OpGrid Database Schema
-- Run this against your Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Opportunities table
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('linkedin', 'wellfound', 'yc', 'telegram', 'career_page', 'hackathon', 'fellowship', 'competition')),
    url TEXT UNIQUE NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    deadline DATE,
    stipend TEXT,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    raw_html TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    seen_at TIMESTAMPTZ,
    -- New hackathon/fellowship fields
    category TEXT CHECK (category IN ('internship', 'hackathon', 'fellowship', 'competition', 'research')),
    prize_pool TEXT,
    team_size TEXT,
    ppo_possible BOOLEAN DEFAULT false,
    registration_open BOOLEAN DEFAULT true,
    event_date DATE
);

-- Create indexes for common queries
CREATE INDEX idx_opportunities_source ON opportunities(source);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_opportunities_tags ON opportunities USING GIN(tags);
CREATE INDEX idx_opportunities_seen_at ON opportunities(seen_at) WHERE seen_at IS NULL;

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN (
      'to_apply', 'registered', 'applied', 'idea_submission', 'idea_shortlisted',
      'video_submission', 'assessment', 'oa_received', 'oa_done',
      'prototype_building', 'hackathon_round', 'semifinalist', 'finalist',
      'presentation', 'interview', 'rejected', 'offer', 'winner', 'ghosted'
    )),
    resume_version TEXT,
    referral_name TEXT,
    follow_up_sent BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date DESC);

-- Resume analyses table
CREATE TABLE resume_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jd_text TEXT NOT NULL,
    resume_text TEXT NOT NULL,
    missing_keywords TEXT[] DEFAULT '{}',
    present_keywords TEXT[] DEFAULT '{}',
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resume_analyses_created_at ON resume_analyses(created_at DESC);

-- Notification log table
CREATE TABLE notif_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('email', 'telegram', 'push')),
    payload JSONB NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_log_type ON notif_log(type);
CREATE INDEX idx_notif_log_sent_at ON notif_log(sent_at DESC);

-- Function to get unseen opportunities count
CREATE OR REPLACE FUNCTION get_unseen_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM opportunities WHERE seen_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to get opportunities expiring soon (within 3 days)
CREATE OR REPLACE FUNCTION get_expiring_soon()
RETURNS TABLE (
    id UUID,
    title TEXT,
    company TEXT,
    deadline DATE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.company,
        o.deadline,
        (o.deadline - CURRENT_DATE) AS days_remaining
    FROM opportunities o
    WHERE o.deadline IS NOT NULL
        AND o.deadline >= CURRENT_DATE
        AND o.deadline <= CURRENT_DATE + INTERVAL '3 days'
    ORDER BY o.deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Enable later with authentication
-- ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notif_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE opportunities IS 'Scraped job/internship opportunities from various sources';
COMMENT ON TABLE applications IS 'User application tracking';
COMMENT ON TABLE resume_analyses IS 'AI-powered resume-JD match analyses';
COMMENT ON TABLE notif_log IS 'Audit log for all notifications sent';
