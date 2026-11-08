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
