const OMDB_API_URL = "https://www.omdbapi.com/";
const ALLOWED_ORIGINS = new Set([
  "https://ctmphoto23-alt.github.io",
  "https://marquee-movie-search.netlify.app",
]);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, "", event);
  }

  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Movie search is not configured yet. Set the OMDB_API_KEY environment variable." }, event);
  }

  const { s, i } = event.queryStringParameters || {};
  if ((!s || !s.trim()) && !i) {
    return jsonResponse(400, { error: "Provide a movie title to search for or an IMDb ID for details." }, event);
  }

  const params = new URLSearchParams({ apikey: apiKey });
  if (i) {
    params.set("i", i);
    params.set("plot", "full");
  } else {
    params.set("s", s.trim());
    params.set("type", "movie");
  }

  try {
    const response = await fetch(`${OMDB_API_URL}?${params}`);
    const data = await response.json();
    if (data.Response === "False" && data.Error !== "Movie not found!") {
      return jsonResponse(502, { error: data.Error || "The movie service rejected the request." }, event);
    }
    return jsonResponse(response.status, data, event);
  } catch {
    return jsonResponse(502, { error: "The movie service could not be reached. Please try again." }, event);
  }
};

function jsonResponse(statusCode, body, event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const corsHeaders = ALLOWED_ORIGINS.has(origin) || isLocalDevelopmentOrigin
    ? { "Access-Control-Allow-Origin": origin }
    : {};

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      ...corsHeaders,
    },
    body: statusCode === 204 ? "" : JSON.stringify(body),
  };
}
