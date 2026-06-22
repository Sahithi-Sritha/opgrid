-- Expand application stages for jobs, internships, fellowships, and hackathons.
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'to_apply',
      'registered',
      'applied',
      'idea_submission',
      'idea_shortlisted',
      'video_submission',
      'assessment',
      'oa_received',
      'oa_done',
      'prototype_building',
      'hackathon_round',
      'semifinalist',
      'finalist',
      'presentation',
      'interview',
      'rejected',
      'offer',
      'winner',
      'ghosted'
    )
  );
