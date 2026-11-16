import { Reader, type CityResponse } from "npm:mmdb-lib@3.0.4";
import { Buffer } from "node:buffer";
import { isIP } from "node:net";

const origin = "https://lalithu.github.io";
const cors = {
  "Access-Control-Allow-Origin": origin,
  "Vary": "Origin",
  "Cache-Control": "no-store",
};

let geo: Promise<Reader<CityResponse> | null> | undefined;
let retryAfter = 0;

async function loadCityDatabase() {
  // Download a public database snapshot. Look up visitor IPs locally.
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCMonth(month.getUTCMonth() - 1);

  try {
    const version = month.toISOString().slice(0, 7);
    const response = await fetch(
      `https://download.db-ip.com/free/dbip-city-lite-${version}.mmdb.gz`,
      { signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok || !response.body) return null;

    const database = new Uint8Array(144 * 1024 * 1024);
    const reader = response.body
      .pipeThrough(new DecompressionStream("gzip"))
      .getReader();
    let size = 0;

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (size + value.byteLength > database.byteLength) {
          await reader.cancel();
          return null;
        }
        database.set(value, size);
        size += value.byteLength;
      }
    } finally {
      reader.releaseLock();
    }

    return new Reader<CityResponse>(Buffer.from(database.buffer, 0, size));
  } catch {
    return null;
  }
}

async function locationFor(ip: string | null) {
  if (!ip) return "Unknown";

  if (!geo || (retryAfter > 0 && Date.now() >= retryAfter)) {
    retryAfter = 0;
    geo = loadCityDatabase().then((db) => {
      if (!db) retryAfter = Date.now() + 300_000;
      return db;
    });
  }

  try {
    const place = (await geo)?.get(ip);
    const region = place?.subdivisions?.[0];
    const parts = [
      place?.city?.names?.en,
      region?.names?.en || region?.iso_code,
      place?.country?.names?.en || place?.country?.iso_code,
    ].filter(Boolean);

    return [...new Set(parts)].join(", ") || "Unknown";
  } catch {
    return "Unknown";
  }
}

function deviceFor(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (["bot", "crawler", "spider", "headless", "curl", "wget"].some(
    (marker) => ua.includes(marker),
  )) return "Bot / automated";

  if (ua.includes("ipad") || (ua.includes("macintosh") && ua.includes("mobile/"))) {
    return "iPad";
  }
  if (ua.includes("iphone") || ua.includes("ipod")) return "iPhone";
  if (ua.includes("android")) {
    return ua.includes("mobile") ? "Android phone" : "Android tablet";
  }
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("cros")) return "Chromebook";
  if (ua.includes("macintosh") || ua.includes("mac os x")) return "Mac";
  if (ua.includes("linux")) return "Linux PC";
  return "Unknown";
}

Deno.serve(async (req) => {
  if (req.headers.get("origin") !== origin) {
    return new Response(null, { status: 403 });
  }
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: cors });
  }

  let modernKey: string | undefined;
  try {
    modernKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
  } catch {
    // Fall back to the legacy service role key.
  }

  const key = modernKey || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");

  if (!key || !url) {
    console.error("Storytime demo collector: Supabase configuration missing");
    return new Response(null, { status: 503, headers: cors });
  }

  try {
    const ip = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]
      .map((header) => req.headers.get(header)?.split(",")[0].trim() || "")
      .find((address) => isIP(address)) ?? null;
    const user_agent = (req.headers.get("user-agent") || "").slice(0, 512);
    const device = deviceFor(user_agent);
    const location = await locationFor(ip);

    const result = await fetch(`${url}/rest/v1/storytime_demo_visits`, {
      method: "POST",
      signal: AbortSignal.timeout(3500),
      headers: {
        apikey: key,
        ...(modernKey ? {} : { Authorization: `Bearer ${key}` }),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ page_path: "/demo/storytime/", ip, location, device, user_agent }),
    });

    if (!result.ok) {
      const { code } = await result.json().catch(() => ({}));
      console.error(
        "Storytime demo collector: insert failed",
        result.status,
        typeof code === "string" ? code.slice(0, 32) : "",
      );
      return new Response(null, { status: 503, headers: cors });
    }

    return new Response(null, { status: 204, headers: cors });
  } catch (error) {
    const details = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error("Storytime demo collector stack:", details.replaceAll(key, "[redacted]"));
    return new Response(null, { status: 503, headers: cors });
  }
});