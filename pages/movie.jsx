import React, { useEffect, useRef, useState } from "react";
import { isStaticPreview, requestMovies } from "../components/MovieCard.jsx";

export function MovieDetails({ movie, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const detailsRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");

    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (isStaticPreview()) {
      setData(movie);
      return () => controller.abort();
    }

    async function loadDetails() {
      try {
        setData(await requestMovies({ i: movie.imdbID }, controller.signal));
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        if (requestError instanceof TypeError) {
          setData(movie);
          setError("Full movie details will be available after the Cloudflare Worker is configured.");
          return;
        }
        setError(requestError.message || "We couldn't load details for this film.");
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [movie]);

  const details = data || movie;
  const title = error && !data ? "Movie details unavailable" : (details.Title || movie.Title);
  const metadata = [
    details.Year,
    details.Runtime !== "N/A" ? details.Runtime : "",
    details.Genre !== "N/A" ? details.Genre : "",
  ].filter(Boolean).join("  ·  ");
  const rating = details.imdbRating && details.imdbRating !== "N/A"
    ? `★ ${details.imdbRating} / 10 on IMDb${details.imdbVotes && details.imdbVotes !== "N/A" ? ` · ${details.imdbVotes} ratings` : ""}`
    : "IMDb rating not available";
  const overview = error
    || (details.Plot && details.Plot !== "N/A"
      ? details.Plot
      : data
        ? "Configure the Cloudflare Worker to load full movie details from OMDb."
        : "Loading movie details…");
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
    <section className="movie-details" ref={detailsRef} aria-live="polite">
      <button className="details-close" type="button" aria-label="Close movie details" onClick={onClose}>×</button>
      <div className={`details-poster-wrap${!details.Poster || details.Poster === "N/A" ? " poster-missing" : ""}`}>
        {details.Poster && details.Poster !== "N/A" && (
          <img className="details-poster" src={details.Poster} alt={`${details.Title || movie.Title} poster`} />
        )}
      </div>
      <div className="details-copy">
        <p className="section-kicker">Now showing</p>
        <h2>{title}</h2>
        <p className="details-meta">{metadata}</p>
        <p className="details-rating">{rating}</p>
        <h3>The story</h3>
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
  );
}
