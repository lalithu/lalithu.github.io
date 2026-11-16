-- Reuse an already recorded city-level lookup for the same IP within one hour.
-- Leave unmatched, unknown, and already detailed demo locations unchanged.
with candidates as (
  select distinct on (s.id) s.id, p.location
  from public.storytime_demo_visits s
  join public.portfolio_visits p on p.ip = s.ip
  where s.ip is not null
    and position(',' in s.location) = 0
    and position(',' in p.location) > 0
    and p.visited_at between s.visited_at - interval '1 hour'
                         and s.visited_at + interval '1 hour'
  order by s.id, abs(extract(epoch from p.visited_at - s.visited_at)),
           p.visited_at desc, p.id desc
)
update public.storytime_demo_visits s
set location = candidates.location
from candidates
where s.id = candidates.id;
