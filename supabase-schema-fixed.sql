-- ============================================================
-- NyayIQ v2 — Supabase Schema FIXED
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgvector
create extension if not exists vector;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  designation text default 'Advocate',
  firm_name text,
  phone text,
  plan text default 'free' check (plan in ('free', 'pro', 'firm', 'enterprise')),
  role text default 'user' check (role in ('user', 'admin')),
  ai_summaries_used_this_month integer default 0,
  billing_name text,
  billing_gstin text,
  billing_address text,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, designation)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'designation', 'Advocate')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- JUDGEMENTS TABLE
-- ============================================================
create table if not exists public.judgements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  parties_appellant text,
  parties_respondent text,
  citation text,
  court text not null,
  bench text,
  tax_type text check (tax_type in ('gst', 'income_tax', 'customs', 'fema', 'other')),
  sections_invoked text[] default '{}',
  keywords text[] default '{}',
  date_decided date,
  date_ingested timestamptz default now(),
  outcome text check (outcome in ('assessee_favoured', 'revenue_favoured', 'mixed', 'procedural')),
  impact text check (impact in ('landmark', 'high', 'medium', 'low')) default 'medium',
  full_text text,
  full_text_url text,
  indian_kanoon_id text unique,
  ai_summary jsonb,
  ai_confidence numeric(3,2),
  ai_verified boolean default false,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_judgements_court on public.judgements(court);
create index if not exists idx_judgements_tax_type on public.judgements(tax_type);
create index if not exists idx_judgements_outcome on public.judgements(outcome);
create index if not exists idx_judgements_date on public.judgements(date_decided desc);
create index if not exists idx_judgements_created on public.judgements(created_at desc);

-- ============================================================
-- AI SUMMARIES LOG
-- ============================================================
create table if not exists public.ai_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  judgement_id uuid references public.judgements(id) on delete set null,
  judgement_title text,
  court text,
  summary_json jsonb,
  model_used text,
  tokens_used integer,
  created_at timestamptz default now()
);

create index if not exists idx_ai_summaries_user on public.ai_summaries(user_id);

-- ============================================================
-- BOOKMARKS TABLE
-- ============================================================
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  judgement_id uuid references public.judgements(id) on delete cascade,
  folder text default 'General',
  note text,
  created_at timestamptz default now(),
  unique(user_id, judgement_id)
);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);

-- ============================================================
-- ARTICLES TABLE
-- ============================================================
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  category text check (category in ('gst', 'income_tax', 'customs', 'itat', 'appeals', 'general')),
  author text default 'Adv. Mohit Jain',
  tags text[] default '{}',
  published boolean default false,
  published_at timestamptz,
  read_time_minutes integer,
  cover_glyph text default '§',
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_articles_published on public.articles(published, published_at desc);

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  razorpay_subscription_id text unique,
  razorpay_payment_id text,
  plan text check (plan in ('pro', 'firm', 'enterprise')),
  status text check (status in ('active', 'cancelled', 'expired', 'trial')) default 'trial',
  amount_paise integer,
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CONTACT SUBMISSIONS
-- ============================================================
create table if not exists public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  responded boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — FIXED (WITH CHECK for INSERT)
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- JUDGEMENTS
alter table public.judgements enable row level security;

create policy "Anyone can read judgements"
  on public.judgements for select
  using (true);

create policy "Admins can insert judgements"
  on public.judgements for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update judgements"
  on public.judgements for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- AI SUMMARIES
alter table public.ai_summaries enable row level security;

create policy "Users can view own summaries"
  on public.ai_summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own summaries"
  on public.ai_summaries for insert
  with check (auth.uid() = user_id);

-- BOOKMARKS
alter table public.bookmarks enable row level security;

create policy "Users can select own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ARTICLES
alter table public.articles enable row level security;

create policy "Anyone can read published articles"
  on public.articles for select
  using (published = true);

create policy "Admins can insert articles"
  on public.articles for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update articles"
  on public.articles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- CONTACT SUBMISSIONS
alter table public.contact_submissions enable row level security;

create policy "Anyone can submit contact form"
  on public.contact_submissions for insert
  with check (true);

create policy "Admins can view submissions"
  on public.contact_submissions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- SUBSCRIPTIONS
alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
select 'Schema deployed successfully!' as status;
-- ============================================================

-- AFTER THIS RUNS — make yourself admin:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
