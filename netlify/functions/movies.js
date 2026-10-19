const OMDB_API_URL = "https://www.omdbapi.com/";

exports.handler = async (event) => {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Movie search is not configured yet. Set the OMDB_API_KEY environment variable." });
  }

  const { s, i } = event.queryStringParameters || {};
  if ((!s || !s.trim()) && !i) {
    return jsonResponse(400, { error: "Provide a movie title to search for or an IMDb ID for details." });
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
      return jsonResponse(502, { error: data.Error || "The movie service rejected the request." });
    }
    return jsonResponse(response.status, data);
  } catch {
    return jsonResponse(502, { error: "The movie service could not be reached. Please try again." });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}
