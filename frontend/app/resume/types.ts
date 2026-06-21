export interface ResumeVersion {
  id: string;
  filename: string;
  label: string;
  latex_source: string;
  pdf_url: string | null;
  base_version_id: string | null;
  created_at: string;
}

export interface SuggestedEdit {
  id: string;
  section: string;
  current_text: string;
  suggested_text: string;
  keywords_added: string[];
}

export interface JdAnalysis {
  match_score: number;
  present_keywords: string[];
  missing_keywords: string[];
  suggested_edits: SuggestedEdit[];
}
