create table if not exists public.rate_limit_attempts (
  action_key text primary key,
  action text not null,
  ip_address text,
  attempts integer not null default 1,
  window_started_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists rate_limit_attempts_action_idx
  on public.rate_limit_attempts (action);

create index if not exists rate_limit_attempts_window_started_at_idx
  on public.rate_limit_attempts (window_started_at);
