Deno.test("stores classified visits, resolves country locally, rejects other origins", async () => {
  let handle!: (req: Request) => Promise<Response>;
  const serve = Deno.serve;
  const fetcher = globalThis.fetch;
  const get = Deno.env.get;
  const inserts: Record<string, string>[] = [];
  let downloads = 0;
  const fixture = Deno.env.get("PORTFOLIO_GEO_FIXTURE");
  if (!fixture) throw new Error("Set PORTFOLIO_GEO_FIXTURE to a DB-IP Country Lite .mmdb.gz");
  const database = await Deno.readFile(fixture);
  try {
    Deno.serve = ((callback: typeof handle) => { handle = callback; }) as typeof Deno.serve;
    Deno.env.get = key => ({SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-only"})[key];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.startsWith("https://download.db-ip.com/free/")) {
        downloads++;
        if (url.includes("8.8.8.8")) throw new Error("IP must never leave the collector");
        return new Response(database);
      }
      if (url !== "https://example.test/rest/v1/portfolio_visits") throw new Error("unexpected fetch");
      inserts.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 201 });
    };
    await import("../functions/track-portfolio-visit/index.ts");
    const visit = (origin: string, ip: string, ua: string) => handle(new Request("https://collector.test/", {
      method: "POST", headers: { origin, "cf-connecting-ip": ip, "user-agent": ua }
    }));
    if ((await visit("https://other.test", "8.8.8.8", "iPhone")).status !== 403) throw new Error("origin check failed");
    const origin = "https://lalithu.github.io";
    if ((await visit(origin, "8.8.8.8", "Mozilla/5.0 (iPhone)")).status !== 204) throw new Error("insert failed");
    if ((await visit(origin, "2001:4860:4860::8888", "Mozilla/5.0 (Windows NT)")).status !== 204) throw new Error("IPv6 insert failed");
    if ((await visit(origin, "invalid", "curl/8.1")).status !== 204) throw new Error("missing-IP insert failed");
    if (downloads !== 1 || inserts.length !== 3 ||
      inserts[0].location === "Unknown" || inserts[0].device !== "iPhone" ||
      inserts[0].user_agent !== "Mozilla/5.0 (iPhone)" || inserts[1].device !== "Windows PC" ||
      inserts[1].location === "Unknown" || inserts[2].location !== "Unknown" ||
      inserts[2].device !== "Bot / automated") throw new Error("incorrect persisted fields");
  } finally {
    Deno.serve = serve;
    Deno.env.get = get;
    globalThis.fetch = fetcher;
  }
});
