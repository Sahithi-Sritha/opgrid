-- Migration: Add Resume Intelligence Engine tables
-- Run this in Supabase SQL Editor after the hackathon migration

-- Resume versions table (stores LaTeX and compiled PDFs)
CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    label TEXT NOT NULL,
    latex_source TEXT NOT NULL,
    pdf_url TEXT,
    base_version_id UUID REFERENCES resume_versions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resume_versions_created_at ON resume_versions(created_at DESC);
CREATE INDEX idx_resume_versions_base ON resume_versions(base_version_id) WHERE base_version_id IS NOT NULL;

COMMENT ON TABLE resume_versions IS 'Stores resume versions with LaTeX source and compiled PDFs';
COMMENT ON COLUMN resume_versions.latex_source IS 'Complete LaTeX source code';
COMMENT ON COLUMN resume_versions.base_version_id IS 'If this is a modified version, points to the original';

-- JD analyses table (stores keyword extraction and matching)
CREATE TABLE IF NOT EXISTS jd_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jd_text TEXT NOT NULL,
    jd_source_url TEXT,
    jd_keywords JSONB NOT NULL,
    resume_version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    missing_keywords TEXT[] DEFAULT '{}',
    present_keywords TEXT[] DEFAULT '{}',
    suggested_edits JSONB,
    ai_rewrite_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jd_analyses_resume ON jd_analyses(resume_version_id);
CREATE INDEX idx_jd_analyses_match_score ON jd_analyses(match_score DESC);
CREATE INDEX idx_jd_analyses_created_at ON jd_analyses(created_at DESC);

COMMENT ON TABLE jd_analyses IS 'JD keyword extraction and resume matching analysis';
COMMENT ON COLUMN jd_analyses.jd_keywords IS 'Extracted keywords: hard_skills, soft_skills, tools, certifications, action_verbs';
COMMENT ON COLUMN jd_analyses.suggested_edits IS 'Array of edit suggestions from AI';

-- Update applications table to reference resume version
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_version_id UUID REFERENCES resume_versions(id);
CREATE INDEX IF NOT EXISTS idx_applications_resume_version ON applications(resume_version_id) WHERE resume_version_id IS NOT NULL;

-- Drop old resume_analyses table if it exists (replaced by jd_analyses)
DROP TABLE IF EXISTS resume_analyses;

-- Helper function: Get latest resume version
CREATE OR REPLACE FUNCTION get_latest_resume_version()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM resume_versions 
        ORDER BY created_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get resume versions derived from a base
CREATE OR REPLACE FUNCTION get_derived_versions(base_id UUID)
RETURNS TABLE (
    id UUID,
    label TEXT,
    created_at TIMESTAMPTZ,
    keywords_added INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rv.id,
        rv.label,
        rv.created_at,
        0 as keywords_added  -- Could calculate from jd_analyses
    FROM resume_versions rv
    WHERE rv.base_version_id = base_id
    ORDER BY rv.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for resumes (run this separately or via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);
