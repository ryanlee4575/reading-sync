create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  onesignal_subscription_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_subscriptions_user_id_idx
  on public.notification_subscriptions(user_id);

alter table public.notification_subscriptions enable row level security;

drop policy if exists "Users manage their notification subscriptions"
  on public.notification_subscriptions;

create policy "Users manage their notification subscriptions"
  on public.notification_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  reading_session_id uuid not null references public.reading_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('weekly_goal', 'group_ready')),
  event_key text not null,
  created_at timestamptz not null default now(),
  unique (reading_session_id, event_type, event_key)
);

alter table public.notification_events enable row level security;
