export type Member = {
  user_id: string;
  display_name: string;
};

export type ProgressRow = {
  user_id: string;
  chapter_completed: number;
};

export type ReadingSession = {
  id: string;
  book_title: string;
  total_chapters: number;
  created_at: string;
  is_active: boolean;
  cover_url: string | null;
  progress_type: string;
  progress: ProgressRow[];
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  group_members: Member[];
  reading_sessions: ReadingSession[];
};
