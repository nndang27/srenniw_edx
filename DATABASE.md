# Database — Supabase Schema

Read CLAUDE.md first for full project context.

## Instructions for Claude
Run all SQL below in Supabase → SQL Editor → New Query.
Run in order: tables first, then RLS policies, then indexes.

---

## Step 1 — Create all tables

```sql
-- =============================================
-- CLASSES: teacher owns one or more classes
-- =============================================
create table public.classes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                   -- e.g. "4B - Mathematics"
  year_level    text not null,                   -- e.g. "Year 4"
  subject       text not null,                   -- e.g. "Mathematics"
  teacher_clerk_id text not null,                -- Clerk user ID of teacher
  created_at    timestamptz default now()
);

-- =============================================
-- CLASS_PARENTS: which parents belong to which class
-- =============================================
create table public.class_parents (
  id                uuid primary key default gen_random_uuid(),
  class_id          uuid references public.classes(id) on delete cascade,
  parent_clerk_id   text not null,               -- Clerk user ID of parent
  preferred_language text default 'en',          -- 'en' | 'vi' | 'zh' | 'ar'
  child_name        text,
  created_at        timestamptz default now(),
  unique(class_id, parent_clerk_id)
);

-- =============================================
-- BRIEFS: teacher input → agent output → parent notification
-- =============================================
create table public.briefs (
  id                uuid primary key default gen_random_uuid(),
  class_id          uuid references public.classes(id) on delete cascade,
  teacher_clerk_id  text not null,
  content_type      text not null,               -- 'assignment' | 'comment' | 'weekly_update'
  raw_input         text not null,               -- original teacher text (unprocessed)
  subject           text,
  year_level        text,

  -- Agent output fields (filled after processing)
  processed_en      text,                        -- simplified English version
  at_home_activities jsonb,                      -- [{title, description, duration_mins}]
  curriculum_notes  text,                        -- curriculum alignment note from CurricuLLM

  status            text default 'pending',      -- 'pending' | 'processing' | 'done' | 'failed'
  created_at        timestamptz default now(),
  published_at      timestamptz                  -- set when status=done
);

-- =============================================
-- TRANSLATIONS: one row per language per brief
-- =============================================
create table public.translations (
  id        uuid primary key default gen_random_uuid(),
  brief_id  uuid references public.briefs(id) on delete cascade,
  language  text not null,                       -- 'vi' | 'zh' | 'ar'
  content   text not null,                       -- translated processed content
  activities_translated jsonb,                   -- translated at_home_activities
  created_at timestamptz default now(),
  unique(brief_id, language)
);

-- =============================================
-- NOTIFICATIONS: one row per parent per brief (inbox item)
-- =============================================
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  brief_id        uuid references public.briefs(id) on delete cascade,
  parent_clerk_id text not null,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

-- =============================================
-- FEEDBACK: parent replies to a brief
-- =============================================
create table public.feedback (
  id              uuid primary key default gen_random_uuid(),
  brief_id        uuid references public.briefs(id) on delete cascade,
  parent_clerk_id text not null,
  message         text not null,
  created_at      timestamptz default now()
);

-- =============================================
-- CHAT_ROOMS: one room per teacher-parent pair
-- =============================================
create table public.chat_rooms (
  id                uuid primary key default gen_random_uuid(),
  teacher_clerk_id  text not null,
  parent_clerk_id   text not null,
  class_id          uuid references public.classes(id),
  created_at        timestamptz default now(),
  unique(teacher_clerk_id, parent_clerk_id)
);

-- =============================================
-- CHAT_MESSAGES: messages in a chat room
-- =============================================
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.chat_rooms(id) on delete cascade,
  sender_id   text not null,                     -- Clerk user ID
  sender_role text not null,                     -- 'teacher' | 'parent'
  content     text not null,
  created_at  timestamptz default now()
);
```

---

## Step 2 — Enable Row Level Security

```sql
alter table public.classes         enable row level security;
alter table public.class_parents   enable row level security;
alter table public.briefs          enable row level security;
alter table public.translations    enable row level security;
alter table public.notifications   enable row level security;
alter table public.feedback        enable row level security;
alter table public.chat_rooms      enable row level security;
alter table public.chat_messages   enable row level security;
```

---

## Step 3 — RLS Policies
Note: Backend uses service_role key which bypasses RLS.
These policies are for direct client queries from Next.js (anon key reads only).

```sql
-- Classes: teacher sees their own, parents see classes they belong to
create policy "teacher sees own classes"
  on public.classes for select
  using (auth.uid()::text = teacher_clerk_id);

-- Briefs: done briefs are visible (parents read via notifications join)
create policy "published briefs readable"
  on public.briefs for select
  using (status = 'done');

-- Notifications: parent sees own notifications only
create policy "parent sees own notifications"
  on public.notifications for select
  using (auth.uid()::text = parent_clerk_id);

-- Translations: public read (briefs are already filtered)
create policy "translations readable"
  on public.translations for select
  using (true);

-- Chat messages: room participants only
create policy "room participants read messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = room_id
      and (r.teacher_clerk_id = auth.uid()::text
        or r.parent_clerk_id = auth.uid()::text)
    )
  );
```

---

## Step 4 — Indexes for performance

```sql
create index idx_briefs_class        on public.briefs(class_id);
create index idx_briefs_status       on public.briefs(status);
create index idx_briefs_teacher      on public.briefs(teacher_clerk_id);
create index idx_notifications_parent on public.notifications(parent_clerk_id);
create index idx_notifications_read  on public.notifications(is_read);
create index idx_chat_messages_room  on public.chat_messages(room_id, created_at);
create index idx_translations_brief  on public.translations(brief_id, language);
```

---

## Step 5 — Enable Realtime on key tables

In Supabase Dashboard → Database → Replication → enable for:
- `notifications` (parent inbox updates live)
- `chat_messages` (real-time chat)
- `briefs` (teacher sees when agent finishes processing)

Or via SQL:
```sql
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.briefs;
```

---

## Data Shape Examples

### Brief with at_home_activities (jsonb)
```json
{
  "at_home_activities": [
    {
      "title": "Pizza fractions",
      "description": "Cut paper into 8 pieces. Take 3 slices. Ask: what fraction did you take?",
      "duration_mins": 10
    },
    {
      "title": "Fraction drawing",
      "description": "Draw a rectangle, divide it into 4 equal parts, colour 2. What fraction is coloured?",
      "duration_mins": 8
    }
  ]
}
```

### Notification inbox query (join)
```sql
select
  n.id, n.is_read, n.created_at,
  b.content_type, b.processed_en, b.at_home_activities, b.published_at,
  t.content as translated_content, t.activities_translated
from notifications n
join briefs b on b.id = n.brief_id
left join translations t on t.brief_id = n.brief_id and t.language = 'vi'
where n.parent_clerk_id = 'user_xxx'
order by n.created_at desc;
```
