import { Reader } from "npm:mmdb-lib@3.0.4";
import { Buffer } from "node:buffer";
import { isIP } from "node:net";

const origin = "https://lalithu.github.io";
const cors = { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Cache-Control": "no-store" };
type GeoRecord = { country?: { names?: { en?: string }; iso_code?: string } };
let geo: Promise<Reader<GeoRecord> | null> | undefined;
let retryAfter = 0;

async function loadCountryDatabase() {
  // Fetch a public database snapshot, never an IP-specific URL.
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCMonth(month.getUTCMonth() - 1);
  try {
    const version = month.toISOString().slice(0, 7);
    const response = await fetch(
      `https://download.db-ip.com/free/dbip-country-lite-${version}.mmdb.gz`,
      { signal: AbortSignal.timeout(2200) },
    );
    if (!response.ok || !response.body) return null;
    const database = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    if (database.byteLength > 16_000_000) return null;
    return new Reader<GeoRecord>(Buffer.from(database));
  } catch { return null; }
}

async function locationFor(ip: string | null) {
  if (!ip) return "Unknown";
  if (!geo || (retryAfter > 0 && Date.now() >= retryAfter)) {
    retryAfter = 0;
    geo = loadCountryDatabase().then(db => {
      if (!db) retryAfter = Date.now() + 300_000;
      return db;
    });
  }
  try {
    const country = (await geo)?.get(ip)?.country;
    return country?.names?.en || country?.iso_code || "Unknown";
  } catch { return "Unknown"; }
}

function deviceFor(ua: string) {
  if (/bot|crawler|spider|headless|curl|wget/i.test(ua)) return "Bot / automated";
  if (/iPad|Macintosh.*Mobile\//i.test(ua)) return "iPad";
  if (/iPhone|iPod/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android phone" : "Android tablet";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/CrOS/i.test(ua)) return "Chromebook";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux PC";
  return "Unknown";
}

Deno.serve(async req => {
  if (req.headers.get("origin") !== origin) return new Response(null, { status: 403 });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: cors });
  const ip = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]
    .map(h => req.headers.get(h)?.split(",")[0].trim() || "")
    .find(ip => isIP(ip)) ?? null;
  const user_agent = (req.headers.get("user-agent") || "").slice(0, 512);
  const location = await locationFor(ip);
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!key || !url) return new Response(null, { status: 503, headers: cors });
  try {
    const result = await fetch(`${url}/rest/v1/portfolio_visits`, {
      method: "POST", signal: AbortSignal.timeout(3500),
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ip, location, device: deviceFor(user_agent), user_agent }),
    });
    return new Response(null, { status: result.ok ? 204 : 503, headers: cors });
  } catch { return new Response(null, { status: 503, headers: cors }); }
});
