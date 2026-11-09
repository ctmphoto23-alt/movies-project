import React, { useEffect, useMemo, useState } from "react";
import MovieCard, { MovieCardSkeleton, getLocalMatches, isStaticPreview, requestMovies } from "../components/MovieCard.jsx";
import { MovieDetails } from "./movie.jsx";

const MAX_VISIBLE_MOVIES = 6;
const SEARCH_DELAY = 450;

const TOP_RATED_IDS = [
  "tt0111161", "tt0068646", "tt0468569", "tt0071562", "tt0167260",
  "tt0050083", "tt0108052", "tt0120737", "tt0110912", "tt0167261",
  "tt1375666", "tt0137523", "tt0109830", "tt0133093", "tt0099685",
];
const FEATURED_COUNT = 10;

function pickRandomMovies(pool, count) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export default function Home({ query }) {
  const [searchSortOrder, setSearchSortOrder] = useState("relevance");
  const [featuredSortOrder, setFeaturedSortOrder] = useState("rating");
  const [movies, setMovies] = useState([]);
  const [picks] = useState(() => pickRandomMovies(TOP_RATED_IDS, FEATURED_COUNT));
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [featuredStatus, setFeaturedStatus] = useState({ message: "Loading current ratings and posters…", state: "loading" });
  const [totalResults, setTotalResults] = useState(0);
  const [searchStatus, setSearchStatus] = useState({ message: "", state: "" });
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    if (isStaticPreview()) {
      setFeaturedStatus({
        message: "Run the app with Vite to load top-rated movies.",
        state: "empty",
      });
      return undefined;
    }

    const controller = new AbortController();

    async function loadFeaturedMovies() {
      const results = await Promise.allSettled(
        picks.map((imdbID) => requestMovies({ i: imdbID }, controller.signal)),
      );

      if (controller.signal.aborted) return;

      const loadedMovies = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => ({ ...result.value, Type: "movie" }));

      setFeaturedMovies(loadedMovies);
      setFeaturedStatus(loadedMovies.length
        ? { message: "", state: "" }
        : { message: "Couldn't load top-rated movies right now. Try searching instead.", state: "error" });
    }

    loadFeaturedMovies();
    return () => controller.abort();
  }, [picks]);

  const visibleMovies = useMemo(() => {
    const sortedMovies = [...movies];
    const comparators = {
      oldest: (a, b) => {
        const yearA = Number.parseInt(a.Year, 10) || Number.MAX_SAFE_INTEGER;
        const yearB = Number.parseInt(b.Year, 10) || Number.MAX_SAFE_INTEGER;
        return yearA - yearB;
      },
      az: (a, b) => a.Title.localeCompare(b.Title, undefined, { sensitivity: "base" }),
      za: (a, b) => b.Title.localeCompare(a.Title, undefined, { sensitivity: "base" }),
    };
    if (comparators[searchSortOrder]) sortedMovies.sort(comparators[searchSortOrder]);
    return sortedMovies.slice(0, MAX_VISIBLE_MOVIES);
  }, [movies, searchSortOrder]);

  const sortedFeaturedMovies = useMemo(() => {
    const sortedMovies = [...featuredMovies];
    const comparators = {
      rating: (a, b) => (Number.parseFloat(b.imdbRating) || 0) - (Number.parseFloat(a.imdbRating) || 0),
      oldest: (a, b) => {
        const yearA = Number.parseInt(a.Year, 10) || Number.MAX_SAFE_INTEGER;
        const yearB = Number.parseInt(b.Year, 10) || Number.MAX_SAFE_INTEGER;
        return yearA - yearB;
      },
      az: (a, b) => a.Title.localeCompare(b.Title, undefined, { sensitivity: "base" }),
      za: (a, b) => b.Title.localeCompare(a.Title, undefined, { sensitivity: "base" }),
    };
    sortedMovies.sort(comparators[featuredSortOrder]);
    return sortedMovies;
  }, [featuredMovies, featuredSortOrder]);

  useEffect(() => {
    const title = query.trim();
    if (!title) {
      setMovies([]);
      setTotalResults(0);
      setSearchStatus({ message: "", state: "" });
      setSelectedMovie(null);
      return undefined;
    }

    const controller = new AbortController();
    setSelectedMovie(null);
    setSearchStatus({ message: `Searching for “${title}”…`, state: "loading" });

    const timer = window.setTimeout(async () => {
      if (isStaticPreview()) {
        const localMatches = getLocalMatches(title);
        setMovies(localMatches);
        setTotalResults(localMatches.length);
        setSearchStatus({
          message: localMatches.length
            ? "Showing the movie titles included with this project. Configure the Cloudflare Worker for live OMDb searches."
            : "No included titles match. Configure the Cloudflare Worker for live OMDb searches.",
          state: localMatches.length ? "empty" : "error",
        });
        return;
      }

      setMovies([]);
      setTotalResults(0);
      setSearchStatus({ message: `Finding movies for “${title}”…`, state: "loading" });

      try {
        const result = await requestMovies({ s: title, type: "movie" }, controller.signal);
        if (result.Response === "False") {
          setMovies([]);
          setTotalResults(0);
          setSearchStatus({ message: `No movies found for “${title}”. Try another title.`, state: "empty" });
          return;
        }

        const searchResults = Array.isArray(result.Search) ? result.Search : [];
        setMovies(searchResults);
        setTotalResults(Number.parseInt(result.totalResults, 10) || 0);
        setSearchStatus(searchResults.length
          ? { message: "", state: "" }
          : { message: `No movies found for “${title}”. Try another title.`, state: "empty" });
      } catch (error) {
        if (error.name === "AbortError") return;
        if (error instanceof TypeError) {
          const localMatches = getLocalMatches(title);
          setMovies(localMatches);
          setTotalResults(localMatches.length);
          setSearchStatus({
            message: localMatches.length
              ? "Live OMDb search is unavailable. Showing included titles; check the Cloudflare Worker URL and deployment."
              : "Live OMDb search is unavailable, and no included titles match. Check the Cloudflare Worker URL and deployment.",
            state: localMatches.length ? "empty" : "error",
          });
          return;
        }
        setMovies([]);
        setTotalResults(0);
        setSearchStatus({ message: error.message || "We couldn't find movies right now. Please try again.", state: "error" });
      }
    }, SEARCH_DELAY);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const heading = query.trim()
    ? `Search results for “${query.trim()}”`
    : "Top-rated movies";
  const displayedMovies = query.trim() ? visibleMovies : sortedFeaturedMovies;
  const isLoading = (query.trim() ? searchStatus.state : featuredStatus.state) === "loading";

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="eyebrow"><span aria-hidden="true">✦</span> A little movie magic</p>
          <h1 id="hero-title">Find your next<br />favorite <span>film.</span></h1>
          <p className="hero-copy">Settle in, get cozy, and discover something wonderful to watch tonight.</p>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <span className="decor-star star-one">✦</span>
          <span className="decor-star star-two">✧</span>
          <div className="ticket">
            <span className="ticket-top">TONIGHT&apos;S FEATURE</span>
            <span className="ticket-art">✦</span>
            <span className="ticket-bottom">GOOD STORIES<br />GREAT COMPANY</span>
          </div>
          <span className="decor-star star-three">✧</span>
        </div>
      </section>

      <section className="movies-section" aria-labelledby="movies-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{query.trim() ? "A little something for your search" : "Find your next favorite"}</p>
            <h2 id="movies-heading">{heading} <span aria-hidden="true">✦</span></h2>
          </div>
          <div className="results-tools">
            <label className="sort-control" htmlFor="sort-order">
              <span>Sort by</span>
              <select
                id="sort-order"
                name="sortOrder"
                value={query.trim() ? searchSortOrder : featuredSortOrder}
                onChange={(event) => {
                  if (query.trim()) {
                    setSearchSortOrder(event.target.value);
                  } else {
                    setFeaturedSortOrder(event.target.value);
                  }
                }}
              >
                {query.trim() ? (
                  <>
                  <option value="relevance">Best match</option>
                  <option value="oldest">Oldest to newest</option>
                  <option value="az">Alphabetical: A–Z</option>
                  <option value="za">Alphabetical: Z–A</option>
                  </>
                ) : (
                  <>
                    <option value="rating">Top rated</option>
                    <option value="oldest">Oldest to newest</option>
                    <option value="az">Alphabetical: A–Z</option>
                    <option value="za">Alphabetical: Z–A</option>
                  </>
                )}
              </select>
            </label>
            {query.trim() ? (
              <p className="results-count">
                {totalResults > 0
                  ? `Showing ${visibleMovies.length} of ${totalResults} matching ${totalResults === 1 ? "movie" : "movies"}`
                  : ""}
              </p>
            ) : <p className="results-count">IMDb Top 250</p>}
          </div>
        </div>
        <p
          className={`status-message${(query.trim() ? searchStatus.state : featuredStatus.state) ? ` ${query.trim() ? searchStatus.state : featuredStatus.state}` : ""}`}
          role="status"
          aria-live="polite"
          hidden={!(query.trim() ? searchStatus.message : featuredStatus.message)}
        >
          {query.trim() ? searchStatus.message : featuredStatus.message}
        </p>
        <div className="movie-grid" aria-busy={isLoading}>
          {isLoading && displayedMovies.length === 0
            ? Array.from({ length: query.trim() ? MAX_VISIBLE_MOVIES : FEATURED_COUNT }, (_, index) => (
              <MovieCardSkeleton key={index} />
            ))
            : displayedMovies.map((movie, index) => (
            <MovieCard
              key={movie.imdbID}
              movie={movie}
              onSelect={setSelectedMovie}
              rank={!query.trim() ? index + 1 : undefined}
            />
          ))}
        </div>
      </section>

      {selectedMovie && (
        <MovieDetails key={selectedMovie.imdbID} movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </main>
  );
}
