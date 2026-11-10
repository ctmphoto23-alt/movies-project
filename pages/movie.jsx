import React, { useEffect, useState } from "react";
import { isStaticPreview, requestMovies } from "../components/MovieCard.jsx";

export default function MovieDetails({ movieId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    window.scrollTo(0, 0);

    if (!/^tt\d+$/.test(movieId)) {
      setError("This movie link is invalid.");
      return () => controller.abort();
    }
    if (isStaticPreview()) {
      setError("Run the app with Vite to load movie details.");
      return () => controller.abort();
    }

    async function loadDetails() {
      try {
        const result = await requestMovies({ i: movieId }, controller.signal);
        if (result.Response === "False") {
          setError(result.Error || "Movie not found.");
          return;
        }
        setData(result);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        setError(requestError.message || "We couldn't load details for this film.");
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [movieId]);

  const details = data || {};
  const metadata = [
    details.Year,
    details.Runtime !== "N/A" ? details.Runtime : "",
    details.Genre !== "N/A" ? details.Genre : "",
  ].filter(Boolean).join("  ·  ");
  const rating = details.imdbRating && details.imdbRating !== "N/A"
    ? `★ ${details.imdbRating} / 10 on IMDb${details.imdbVotes && details.imdbVotes !== "N/A" ? ` · ${details.imdbVotes} ratings` : ""}`
    : "IMDb rating not available";
  const overview = details.Plot && details.Plot !== "N/A"
    ? details.Plot
    : "No plot available.";
  const hasValue = (value) => value && value !== "N/A";
  const ratingSources = (details.Ratings || [])
    .map(({ Source, Value }) => `${Source === "Internet Movie Database" ? "IMDb" : Source}: ${Value}`)
    .join("  ·  ");
  const facts = [
    ["Rated", details.Rated],
    ["Genre", details.Genre],
    ["Runtime", details.Runtime],
    ["Released", details.Released],
    ["Director", details.Director],
    ["Writer", details.Writer],
    ["Cast", details.Actors],
    ["Language", details.Language],
    ["Country", details.Country],
    ["Awards", details.Awards],
    ["Ratings", ratingSources],
    ["Metascore", details.Metascore],
    ["Box office", details.BoxOffice],
    ["Production", details.Production],
    ["DVD release", details.DVD],
    ["Website", details.Website],
    ["Type", details.Type],
    ["IMDb ID", details.imdbID],
  ].filter(([, value]) => hasValue(value));

  return (
    <main className="movie-page">
      <a className="details-back" href="#top">← Back to movies</a>
      {!data ? (
        <p className={`status-message ${error ? "error" : "loading"}`} role="status">
          {error || "Loading movie details…"}
        </p>
      ) : (
        <section className="movie-details" aria-label="Movie details">
          <div className={`details-poster-wrap${!details.Poster || details.Poster === "N/A" ? " poster-missing" : ""}`}>
            {details.Poster && details.Poster !== "N/A" && (
              <img className="details-poster" src={details.Poster} alt={`${details.Title} poster`} />
            )}
          </div>
          <div className="details-copy">
            <p className="section-kicker">Now showing</p>
            <h1>{details.Title}</h1>
            <p className="details-meta">{metadata}</p>
            <p className="details-rating">{rating}</p>
            <h2>The story</h2>
            <p className="details-overview">{overview}</p>
            <dl className="details-facts">
              {facts.map(([label, value]) => (
                <div key={label} className={["Cast", "Awards", "Ratings", "Writer", "Website"].includes(label) ? "fact-wide" : undefined}>
                  <dt>{label}</dt>
                  <dd>
                    {label === "Website" ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </main>
  );
}
