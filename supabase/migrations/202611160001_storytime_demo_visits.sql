create table if not exists public.storytime_demo_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  page_path text not null default '/demo/storytime/' check (page_path = '/demo/storytime/'),
  ip inet,
  location text not null default 'Unknown',
  device text not null,
  user_agent text not null check (length(user_agent) <= 512)
);
alter table public.storytime_demo_visits enable row level security;
revoke all on table public.storytime_demo_visits from public, anon, authenticated;
grant insert on table public.storytime_demo_visits to service_role;
grant usage on sequence public.storytime_demo_visits_id_seq to service_role;
create index if not exists storytime_demo_visits_time_idx on public.storytime_demo_visits (visited_at desc);
