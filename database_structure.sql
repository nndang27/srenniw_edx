-- 1. BẢNG QUẢN LÝ TUẦN HỌC (Từ List_weeks_schedule)
CREATE TABLE public.academic_weeks (
  id text NOT NULL, -- "1", "2", "3" (week_id)
  week_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  CONSTRAINT academic_weeks_pkey PRIMARY KEY (id)
);

-- 2. BẢNG LỚP HỌC (Gộp classes cũ và List_subjects)
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id text NOT NULL UNIQUE, -- Mã nội bộ (VD: "1234")
  course_id text UNIQUE,         -- Mã Google Classroom (VD: "848955656806")
  name text NOT NULL,            -- "1A1" (class_name)
  subject text NOT NULL,         -- "Math" (course_name)
  course_section text,
  course_state text DEFAULT 'ACTIVE',
  fetched_at timestamp with time zone,
  year_level text NOT NULL,
  teacher_clerk_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);

-- 3. BẢNG HỌC SINH (Từ List_students)
CREATE TABLE public.students (
  id text NOT NULL, -- student_id từ Google Classroom
  name text NOT NULL,
  email text,
  class_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

-- 4. BẢNG HỒ SƠ GIA ĐÌNH (Từ List_family_profiles)
CREATE TABLE public.family_profiles (
  student_id text NOT NULL,
  email text, -- Email phụ huynh
  native_language text,
  religion text,
  family_structure text,
  father_job text,
  mother_job text,
  family_notes text,
  CONSTRAINT family_profiles_pkey PRIMARY KEY (student_id),
  CONSTRAINT family_profiles_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- 5. BẢNG NHẬT KÝ AI / TRACKING (Từ List_students -> diary)
CREATE TABLE public.student_diaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  week_id text NOT NULL,
  date date NOT NULL,
  is_school_day boolean DEFAULT true,
  subject text,
  cognitive_level integer,
  emotion text,
  parent_note text,
  parent_note_scores jsonb, -- Chứa: emotion_sentiment, parent_child_connection...
  teacher_note text,
  teacher_note_scores jsonb, -- Chứa: emotion_sentiment, encouragement_level...
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_diaries_pkey PRIMARY KEY (id),
  CONSTRAINT student_diaries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_diaries_week_id_fkey FOREIGN KEY (week_id) REFERENCES public.academic_weeks(id)
);

-- 6. BẢNG BÀI TẬP & TÀI LIỆU (Từ List_subjects -> items)
CREATE TABLE public.course_items (
  id text NOT NULL, -- id của bài tập (VD: "848956929841")
  class_id uuid NOT NULL,
  week_id text NOT NULL,
  type text NOT NULL, -- "assignment" hoặc "material"
  title text NOT NULL,
  description text,
  state text,
  work_type text,
  max_points integer,
  attachments jsonb DEFAULT '[]'::jsonb,
  scheduled_time timestamp with time zone,
  due_date timestamp with time zone,
  created_time timestamp with time zone,
  update_time timestamp with time zone,
  CONSTRAINT course_items_pkey PRIMARY KEY (id),
  CONSTRAINT course_items_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT course_items_week_id_fkey FOREIGN KEY (week_id) REFERENCES public.academic_weeks(id)
);

-- 7. BẢNG ĐIỂM / BÀI NỘP (Từ course_items -> students)
CREATE TABLE public.student_submissions (
  item_id text NOT NULL,
  student_id text NOT NULL,
  state text, -- "TURNED_IN"
  late boolean DEFAULT false,
  assigned_grade numeric(5,2), -- Có thể NULL nếu cô chưa chấm
  draft_grade numeric(5,2),
  submitted_at timestamp with time zone,
  CONSTRAINT student_submissions_pkey PRIMARY KEY (item_id, student_id), -- Composite Key
  CONSTRAINT student_submissions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.course_items(id),
  CONSTRAINT student_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- 8. BẢNG BRIEFS / BÁO CÁO TỔNG HỢP (Nâng cấp briefs cũ + List_summary)
CREATE TABLE public.briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  week_id text NOT NULL,
  date date,
  teacher_clerk_id text NOT NULL,
  content_type text NOT NULL,
  raw_input text NOT NULL,
  subject text,
  year_level text,
  processed_en text,
  at_home_activities jsonb,
  curriculum_notes text,
  
  -- Các trường JSONB mới từ List_summary
  deepdive_data jsonb,   -- core_concept, key_vocabulary, why_this_matters...
  tiktok_data jsonb,     -- video_local_path, metadata...
  summarize_data jsonb,  -- essence, example...

  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT briefs_pkey PRIMARY KEY (id),
  CONSTRAINT briefs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT briefs_week_id_fkey FOREIGN KEY (week_id) REFERENCES public.academic_weeks(id)
);

-- =========================================================================
-- CÁC BẢNG APP FEATURES (Giữ nguyên cấu trúc cũ, chỉ tinh chỉnh Foreign Key)
-- =========================================================================

CREATE TABLE public.class_parents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  student_id text, -- Liên kết phụ huynh với học sinh cụ thể
  parent_clerk_id text NOT NULL,
  preferred_language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_parents_pkey PRIMARY KEY (id),
  CONSTRAINT class_parents_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_parents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_clerk_id text NOT NULL,
  parent_clerk_id text NOT NULL,
  class_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT chat_rooms_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  sender_id text NOT NULL,
  sender_role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id)
);

CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brief_id uuid,
  parent_clerk_id text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brief_id uuid,
  parent_clerk_id text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id)
);

CREATE TABLE public.translations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brief_id uuid,
  language text NOT NULL,
  content text NOT NULL,
  activities_translated jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT translations_pkey PRIMARY KEY (id),
  CONSTRAINT translations_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id)
);



CREATE TABLE IF NOT EXISTS lecture_blocks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id    TEXT NOT NULL,
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT 'General',
  content     TEXT DEFAULT '',
  week_id     TEXT,          -- YYYY-WXX format, NULL = in queue (unscheduled)
  day_of_week INT,           -- 0=Monday … 4=Friday, NULL = in queue
  sort_order  INT DEFAULT 0, -- stacking order within same cell
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lecture_blocks_class_id ON lecture_blocks(class_id);
CREATE INDEX IF NOT EXISTS lecture_blocks_week_id  ON lecture_blocks(week_id);

ALTER TABLE lecture_blocks ENABLE ROW LEVEL SECURITY;

-- Allow full access (teacher service-role key bypasses RLS)
CREATE POLICY "service role full access" ON lecture_blocks
  FOR ALL USING (true);


