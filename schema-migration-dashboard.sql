-- Migration: Add Dashboard & Notification Features
-- Run this in Supabase SQL Editor

-- Add last_notified_at to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_opportunities_last_notified ON opportunities(last_notified_at) WHERE last_notified_at IS NOT NULL;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('deadline', 'new_batch', 'applied', 'follow_up_due', 'registration_closing', 'match_high')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

COMMENT ON TABLE notifications IS 'In-app notification feed';
COMMENT ON COLUMN notifications.related_id IS 'opportunity_id or application_id';

-- Saved opportunities table (for "Save for later")
CREATE TABLE IF NOT EXISTS saved_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    notes TEXT,
    reminder_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(opportunity_id)
);

CREATE INDEX idx_saved_opportunities_reminder ON saved_opportunities(reminder_date) WHERE reminder_date IS NOT NULL;

-- Scraper run logs
CREATE TABLE IF NOT EXISTS scraper_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraper_name TEXT NOT NULL,
    ran_at TIMESTAMPTZ DEFAULT NOW(),
    new_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    status TEXT CHECK (status IN ('success', 'error', 'partial'))
);

CREATE INDEX idx_scraper_runs_name ON scraper_runs(scraper_name);
CREATE INDEX idx_scraper_runs_ran_at ON scraper_runs(ran_at DESC);

COMMENT ON TABLE scraper_runs IS 'Audit log for scraper executions';

-- Function: Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_opportunities', (SELECT COUNT(*) FROM opportunities),
        'applications_this_week', (
            SELECT COUNT(*) 
            FROM applications 
            WHERE applied_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'deadlines_next_week', (
            SELECT COUNT(*) 
            FROM opportunities 
            WHERE deadline IS NOT NULL 
            AND deadline >= CURRENT_DATE 
            AND deadline <= CURRENT_DATE + INTERVAL '7 days'
        ),
        'active_pipeline', (
            SELECT COUNT(*) 
            FROM applications 
            WHERE status NOT IN ('rejected', 'ghosted')
        ),
        'unread_notifications', (
            SELECT COUNT(*) 
            FROM notifications 
            WHERE read_at IS NULL
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Get urgent deadlines
CREATE OR REPLACE FUNCTION get_urgent_deadlines(days_ahead INT DEFAULT 14)
RETURNS TABLE (
    id UUID,
    title TEXT,
    company TEXT,
    deadline DATE,
    days_remaining INT,
    urgency_level TEXT,
    already_applied BOOLEAN,
    category TEXT,
    prize_pool TEXT,
    url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.company,
        o.deadline,
        (o.deadline - CURRENT_DATE) AS days_remaining,
        CASE
            WHEN (o.deadline - CURRENT_DATE) <= 3 THEN 'urgent'
            WHEN (o.deadline - CURRENT_DATE) <= 7 THEN 'warning'
            ELSE 'normal'
        END AS urgency_level,
        EXISTS(SELECT 1 FROM applications WHERE opportunity_id = o.id) AS already_applied,
        o.category,
        o.prize_pool,
        o.url
    FROM opportunities o
    WHERE o.deadline IS NOT NULL
        AND o.deadline >= CURRENT_DATE
        AND o.deadline <= CURRENT_DATE + days_ahead
    ORDER BY o.deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get opportunities scraped in last N days (for sparkline)
CREATE OR REPLACE FUNCTION get_scraping_sparkline(days INT DEFAULT 7)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(json_build_object('date', date, 'count', count))
        FROM (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM opportunities
            WHERE created_at >= CURRENT_DATE - days
            GROUP BY DATE(created_at)
            ORDER BY date
        ) sparkline_data
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
