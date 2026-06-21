-- Migration: Add hackathon/fellowship support to opportunities table
-- Run this if you already have the opportunities table created

-- Add new source types
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_source_check;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_source_check 
    CHECK (source IN ('linkedin', 'wellfound', 'yc', 'telegram', 'career_page', 'hackathon', 'fellowship', 'competition'));

-- Add new columns
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS category TEXT 
    CHECK (category IN ('internship', 'hackathon', 'fellowship', 'competition', 'research'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prize_pool TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ppo_possible BOOLEAN DEFAULT false;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS event_date DATE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_event_date ON opportunities(event_date) WHERE event_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_ppo_possible ON opportunities(ppo_possible) WHERE ppo_possible = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_registration_open ON opportunities(registration_open) WHERE registration_open = true;

COMMENT ON COLUMN opportunities.category IS 'Type of opportunity: internship, hackathon, fellowship, competition, research';
COMMENT ON COLUMN opportunities.prize_pool IS 'Prize money for hackathons/competitions (e.g. ₹5,00,000)';
COMMENT ON COLUMN opportunities.team_size IS 'Allowed team size (e.g. 1-4)';
COMMENT ON COLUMN opportunities.ppo_possible IS 'Whether event is known to convert to PPO/internship';
COMMENT ON COLUMN opportunities.registration_open IS 'Whether registration is currently open';
COMMENT ON COLUMN opportunities.event_date IS 'Event/hackathon start date';
