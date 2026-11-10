import React, { useEffect, useRef, useState } from "react";

const API_ROOT = "https://marquee-movie-search.ctmphoto23.workers.dev";

const initialMovies = [
  { Title: "The Fast and the Furious", Year: "2001", imdbID: "tt0232500", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZGRiMDE1NTMtMThmZS00YjE4LWI1ODQtNjRkZGZlOTg2MGE1XkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg" },
  { Title: "Fast & Furious 6", Year: "2013", imdbID: "tt1905041", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTM3NTg2NDQzOF5BMl5BanBnXkFtZTcwNjc2NzQzOQ@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "Fast Five", Year: "2011", imdbID: "tt1596343", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTUxNTk5MTE0OF5BMl5BanBnXkFtZTcwMjA2NzY3NA@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "Fast & Furious", Year: "2009", imdbID: "tt1013752", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BM2Y1YzhkNzUtMzhmZC00OTFkLWJjZDktMWYzZmQ0Y2Y5ODcwXkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg" },
  { Title: "The Fast and the Furious: Tokyo Drift", Year: "2006", imdbID: "tt0463985", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZGNmMDQxNTQtODMzNS00Y2IzLWFiYjMtZmI5YzdmYmE5YmUxXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "2 Fast 2 Furious", Year: "2003", imdbID: "tt0322259", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BOTQzYzEwNWMtOTAwYy00YWYwLWE1NTEtZTk4OTAxXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { Title: "Fast & Furious Presents: Hobbs & Shaw", Year: "2019", imdbID: "tt6806448", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BNmU4OTA5NGYtMTFjMS00MzgxLWFjNTMtYjdlMThlYzc4M2M4XkEyXkFqcGc@._V1_QL75_UY562_CR3,0,380,562_.jpg" },
  { Title: "F9: The Fast Saga", Year: "2021", imdbID: "tt5433138", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BODJkMTQ5ZmQtNzQxYy00ZWNlLWI0ZGYtYjU1NzdiMjcyNDRmXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg" },
  { Title: "Fast X", Year: "2023", imdbID: "tt5433140", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BYzEwZjczOTktYzU1OS00YjJlLTgyY2UtNWEzODBlN2RjZDEwXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg" },
  { Title: "Fast Times at Ridgemont High", Year: "1982", imdbID: "tt0083929", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMWM4NTc3N2YtMjk2Ny00MTRmLWE4YzItNTVhMTRlODVkNmE5XkEyXkFqcGc@._V1_QL75_UX380_CR0,5,380,562_.jpg" },
];

const localDirectors = {
  tt0232500: "Rob Cohen",
  tt1905041: "Justin Lin",
  tt1596343: "Justin Lin",
  tt1013752: "Justin Lin",
  tt0463985: "Justin Lin",
  tt0322259: "John Singleton",
  tt6806448: "David Leitch",
  tt5433138: "Justin Lin",
  tt5433140: "Louis Leterrier",
  tt0083929: "Amy Heckerling",
};

const directorCache = new Map();

export function isStaticPreview() {
  return window.location.protocol === "file:";
}

export function getLocalMatches(query) {
  const normalizedQuery = query.toLocaleLowerCase();
  return initialMovies.filter((movie) =>
    movie.Title.toLocaleLowerCase().includes(normalizedQuery));
}

export async function requestMovies(params, signal) {
  if (isStaticPreview()) {
    throw new Error("Live movie search needs the Cloudflare Worker. Use the published site after configuring its Worker URL.");
  }

  const url = new URL(API_ROOT);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { signal });
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The movie service returned an unreadable response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(data.error || "We couldn't load movies right now. Please try again.");
  }

  return data;
}

function getDirector(movie) {
  if (localDirectors[movie.imdbID]) {
    return Promise.resolve(localDirectors[movie.imdbID]);
  }

  if (!directorCache.has(movie.imdbID)) {
    directorCache.set(
      movie.imdbID,
      requestMovies({ i: movie.imdbID }).then((data) =>
        data.Director && data.Director !== "N/A" ? data.Director : "Not listed",
      ).catch(() => "Director unavailable"),
    );
  }

  return directorCache.get(movie.imdbID);
}

export function MovieCardSkeleton() {
  return (
    <div className="movie-card skeleton-card" aria-hidden="true">
      <span className="poster-wrap skeleton-block" />
      <span className="card-info">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line-short" />
      </span>
    </div>
  );
}

export default function MovieCard({ movie, rank }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [director, setDirector] = useState("Loading director…");
  const [showDirector, setShowDirector] = useState(false);
  const hoverTimer = useRef();
  const isActive = useRef(false);

  function showDirectorOnFocus() {
    isActive.current = true;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      getDirector(movie).then((value) => {
        if (isActive.current) {
          setDirector(`Directed by ${value}`);
          setShowDirector(true);
        }
      });
    }, 250);
  }

  function hideDirector() {
    isActive.current = false;
    window.clearTimeout(hoverTimer.current);
    setShowDirector(false);
  }

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  return (
    <a
      className={`movie-card${showDirector ? " show-director" : ""}`}
      href={`#/movie/${encodeURIComponent(movie.imdbID)}`}
      aria-label={`View details for ${movie.Title}`}
      onMouseEnter={showDirectorOnFocus}
      onMouseLeave={hideDirector}
      onFocus={showDirectorOnFocus}
      onBlur={hideDirector}
    >
      <span className={`poster-wrap${!movie.Poster || movie.Poster === "N/A" || posterFailed ? " poster-missing" : ""}`}>
        {rank && <span className="card-rank">#{rank}</span>}
        {movie.Poster && movie.Poster !== "N/A" && !posterFailed && (
          <img
            className="card-poster"
            src={movie.Poster}
            alt={`${movie.Title} poster`}
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        )}
        <span className="card-director">{director}</span>
      </span>
      <span className="card-info">
        <span className="card-title">{movie.Title}</span>
        <span className="card-meta">
          {movie.imdbRating && movie.imdbRating !== "N/A" && <span className="card-rating">★ {movie.imdbRating}</span>}
          {movie.Year || "Year unknown"}{movie.Type ? ` · ${movie.Type}` : ""}
        </span>
      </span>
    </a>
  );
}
