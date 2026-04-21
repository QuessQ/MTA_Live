// PULSE — MTA GTFS-Realtime relay.
// One job: front the MTA's GTFS-RT endpoints with CORS + short edge cache.
// No keys, no user state, no logs beyond Cloudflare's free-tier health signals.

export interface Env {
  UPSTREAM: string;
  CACHE_TTL: string;
}

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

// Only allow paths matching the NYCT GTFS-RT feed naming convention.
// e.g. /nyct%2Fgtfs, /nyct%2Fgtfs-ace, /nyct%2Fgtfs-bdfm, ...
const ALLOWED = /^\/nyct(%2F|\/)gtfs(-[a-z0-9]+)?$/i;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (req.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(req.url);
    if (!ALLOWED.test(url.pathname)) {
      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    }

    const ttl = parseInt(env.CACHE_TTL || "10", 10);
    const cache = caches.default;
    const cacheKey = new Request(`${env.UPSTREAM}${url.pathname}`, { method: "GET" });

    let res = await cache.match(cacheKey);
    if (!res) {
      const upstream = await fetch(cacheKey, {
        cf: { cacheTtl: ttl, cacheEverything: true },
      });
      if (!upstream.ok) {
        return new Response(`Upstream ${upstream.status}`, {
          status: 502,
          headers: CORS_HEADERS,
        });
      }
      res = new Response(upstream.body, upstream);
      res.headers.set("cache-control", `public, max-age=${ttl}`);
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
      await cache.put(cacheKey, res.clone());
    } else {
      res = new Response(res.body, res);
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
    }
    return res;
  },
};
