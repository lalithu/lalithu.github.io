create table if not exists public.portfolio_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  ip inet,
  location text not null default 'Unknown',
  device text not null,
  user_agent text not null check (length(user_agent) <= 512)
);
alter table public.portfolio_visits enable row level security;
revoke all on table public.portfolio_visits from public, anon, authenticated;
grant insert on table public.portfolio_visits to service_role;
grant usage on sequence public.portfolio_visits_id_seq to service_role;
create index if not exists portfolio_visits_time_idx on public.portfolio_visits (visited_at desc);
