# Portfolio visits
This is separate from the Lab tracker. Run the SQL migration, deploy `track-portfolio-visit` with JWT verification off, and test an anonymous POST with Origin `https://lalithu.github.io`. Enable `portfolio_visit_tracking` in _config.yml only after the function returns 204 and the row is visible in the project. The browser sends no credentials or payload.

Open Table Editor → portfolio_visits and sort visited_at descending, or use SQL Editor:

```sql
select visited_at at time zone 'America/New_York' as time_et, ip, location, device, user_agent
from public.portfolio_visits
order by visited_at desc, id desc
limit 100;
```

Location is best-effort country from [DB-IP Lite](https://db-ip.com/db/lite.php) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). The function downloads the previous month's country database and looks up IPs in memory; no visitor IP is sent to the data provider. Location is Unknown if the database is unavailable. Origin checking prevents ordinary cross-site browser calls; it does not authenticate a visitor or prevent all automation. The table is private by default. To keep rows for 30 days, schedule a daily Supabase Cron query targeting only this table:

```sql
delete from public.portfolio_visits where visited_at < now() - interval '30 days';
```

## Storytime demo visits

The separate `storytime_demo_visits` table and `track-storytime-demo-visit` function collect only `/demo/storytime/` page visits. Location uses the same DB-IP City Lite lookup as the live portfolio collector: city, region/state, and country when available, with coarser or Unknown fallbacks. Visitor IPs are resolved inside the function and are not sent to a geolocation API. Apply `202611160001_storytime_demo_visits.sql`, then deploy the function with JWT verification off. The general portfolio tracker excludes this path. The browser honors Global Privacy Control and Do Not Track and sends no payload or credentials. Demo codes, query parameters, and transaction events are not collected.

```sql
select visited_at at time zone 'America/New_York' as time_et, page_path, ip, location, device
from public.storytime_demo_visits
order by visited_at desc, id desc
limit 100;
```

Origin checking is not authentication and does not stop spoofed requests. Rows are private; the browser cannot read them. A suggested 30-day retention query, scoped only to this new table:

```sql
delete from public.storytime_demo_visits where visited_at < now() - interval '30 days';
```
