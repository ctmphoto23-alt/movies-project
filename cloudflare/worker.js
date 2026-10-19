const OMDB_API_URL = "https://www.omdbapi.com/";
const ALLOWED_ORIGINS = new Set([
  "https://ctmphoto23-alt.github.io",
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "GET") {
      return jsonResponse(405, { error: "Only GET requests are supported." }, corsHeaders);
    }

    if (!env.OMDB_API_KEY) {
      return jsonResponse(500, {
        error: "Movie search is not configured yet. Set the OMDB_API_KEY secret in Cloudflare.",
      }, corsHeaders);
    }

    const requestUrl = new URL(request.url);
    const title = requestUrl.searchParams.get("s")?.trim();
    const imdbId = requestUrl.searchParams.get("i")?.trim();
    if ((!title || !title.length) && !imdbId) {
      return jsonResponse(400, {
        error: "Provide a movie title to search for or an IMDb ID for details.",
      }, corsHeaders);
    }

    const params = new URLSearchParams({ apikey: env.OMDB_API_KEY });
    if (imdbId) {
      params.set("i", imdbId);
      params.set("plot", "full");
    } else {
      params.set("s", title);
      params.set("type", "movie");
    }

    try {
      const response = await fetch(`${OMDB_API_URL}?${params}`);
      const data = await response.json();
      if (data.Response === "False" && data.Error !== "Movie not found!") {
        return jsonResponse(502, {
          error: data.Error || "The movie service rejected the request.",
        }, corsHeaders);
      }
      return jsonResponse(response.status, data, corsHeaders);
    } catch {
      return jsonResponse(502, {
        error: "The movie service could not be reached. Please try again.",
      }, corsHeaders);
    }
  },
};

function getCorsHeaders(origin) {
  const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) || isLocalDevelopmentOrigin;
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

function jsonResponse(status, body, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
