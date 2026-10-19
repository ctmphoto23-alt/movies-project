const API_ROOT = "/.netlify/functions/movies";
const searchForm = document.querySelector("#search-form");
const queryInput = document.querySelector("#movie-query");
const grid = document.querySelector("#movie-grid");
const statusMessage = document.querySelector("#status-message");
const resultsCount = document.querySelector("#results-count");
const sectionKicker = document.querySelector("#section-kicker");
const moviesHeading = document.querySelector("#movies-heading");
const details = document.querySelector("#movie-details");
const MAX_VISIBLE_MOVIES = 6;
const SEARCH_DELAY = 450;

const initialMovies = [
  { Title: "The Fast and the Furious", Year: "2001", imdbID: "tt0232500", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZGRiMDE1NTMtMThmZS00YjE4LWI1ODQtNjRkZGZlOTg2MGE1XkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg" },
  { Title: "Fast & Furious 6", Year: "2013", imdbID: "tt1905041", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTM3NTg2NDQzOF5BMl5BanBnXkFtZTcwNjc2NzQzOQ@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "Fast Five", Year: "2011", imdbID: "tt1596343", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTUxNTk5MTE0OF5BMl5BanBnXkFtZTcwMjA2NzY3NA@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "Fast & Furious", Year: "2009", imdbID: "tt1013752", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BM2Y1YzhkNzUtMzhmZC00OTFkLWJjZDktMWYzZmQ0Y2Y5ODcwXkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg" },
  { Title: "The Fast and the Furious: Tokyo Drift", Year: "2006", imdbID: "tt0463985", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZGNmMDQxNTQtODMzNS00Y2IzLWFiYjMtZmI5YzdmYmE5YmUxXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { Title: "2 Fast 2 Furious", Year: "2003", imdbID: "tt0322259", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BOTQzYzEwNWMtOTAwYy00YWYwLWE1NTEtZTkxOGQxZTM0M2VhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { Title: "Fast & Furious Presents: Hobbs & Shaw", Year: "2019", imdbID: "tt6806448", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BNmU4OTA5NGYtMTFjMS00MzgxLWFjNTMtYjdlMThlYzc4M2M4XkEyXkFqcGc@._V1_QL75_UY562_CR3,0,380,562_.jpg" },
  { Title: "F9: The Fast Saga", Year: "2021", imdbID: "tt5433138", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BODJkMTQ5ZmQtNzQxYy00ZWNlLWI0ZGYtYjU1NzdiMjcyNDRmXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg" },
  { Title: "Fast X", Year: "2023", imdbID: "tt5433140", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BYzEwZjczOTktYzU1OS00YjJlLTgyY2UtNWEzODBlN2RjZDEwXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg" },
  { Title: "Fast Times at Ridgemont High", Year: "1982", imdbID: "tt0083929", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMWM4NTc3N2YtMjk2Ny00MTRmLWE4YzItNTVhMTRlODVkNmE5XkEyXkFqcGc@._V1_QL75_UX380_CR0,5,380,562_.jpg" },
];

let searchTimer;
let searchController;
let detailsController;
let totalResults = 0;

function isLocalPreview() {
  return window.location.protocol === "file:"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";
}

async function requestMovies(params, signal) {
  if (isLocalPreview()) {
    throw new Error("Live movie search needs the Netlify Function. Deploy this project to Netlify or run it with Netlify Dev.");
  }

  const url = new URL(API_ROOT, window.location.href);
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

function createMovieCard(movie) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "movie-card";
  card.setAttribute("aria-label", `View details for ${movie.Title}`);

  const posterWrap = document.createElement("span");
  posterWrap.className = "poster-wrap";
  if (movie.Poster && movie.Poster !== "N/A") {
    const poster = document.createElement("img");
    poster.className = "card-poster";
    poster.src = movie.Poster;
    poster.alt = `${movie.Title} poster`;
    poster.loading = "lazy";
    poster.addEventListener("error", () => {
      poster.remove();
      posterWrap.classList.add("poster-missing");
      posterWrap.textContent = "✦";
    }, { once: true });
    posterWrap.append(poster);
  } else {
    posterWrap.classList.add("poster-missing");
    posterWrap.textContent = "✦";
  }

  const info = document.createElement("span");
  info.className = "card-info";
  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = movie.Title;

  const metadata = document.createElement("span");
  metadata.className = "card-meta";
  metadata.textContent = `${movie.Year || "Year unknown"}${movie.Type ? ` · ${movie.Type}` : ""}`;

  info.append(title, metadata);
  card.append(posterWrap, info);
  card.addEventListener("click", () => showMovieDetails(movie));
  return card;
}

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${state ? ` ${state}` : ""}`;
  statusMessage.hidden = !message;
  grid.setAttribute("aria-busy", String(state === "loading"));
}

function clearSearchResults() {
  if (searchController) searchController.abort();
  if (detailsController) detailsController.abort();
  details.hidden = true;
  totalResults = 0;
  grid.replaceChildren();
  resultsCount.textContent = "";
  sectionKicker.textContent = "Find your next favorite";
  moviesHeading.firstChild.textContent = "Search by movie title ";
  setStatus("");
}

function renderMovies(movies, query) {
  const visibleMovies = movies.slice(0, MAX_VISIBLE_MOVIES);
  grid.replaceChildren(...visibleMovies.map(createMovieCard));
  const displayedCount = visibleMovies.length;
  resultsCount.textContent = totalResults
    ? `Showing ${displayedCount} of ${totalResults} matching ${totalResults === 1 ? "movie" : "movies"}`
    : "";

  if (displayedCount) {
    setStatus("");
  } else {
    setStatus(`No movies found for “${query}”. Try another title.`, "empty");
  }
}

async function searchMovies(query) {
  const title = query.trim();
  if (searchController) searchController.abort();
  if (detailsController) detailsController.abort();
  details.hidden = true;

  if (!title) {
    clearSearchResults();
    return;
  }

  if (isLocalPreview()) {
    const localMatches = initialMovies.filter((movie) =>
      movie.Title.toLocaleLowerCase().includes(title.toLocaleLowerCase()));
    if (localMatches.length) {
      totalResults = localMatches.length;
      sectionKicker.textContent = "From your OMDb search";
      moviesHeading.firstChild.textContent = `Search results for “${title}” `;
      renderMovies(localMatches, title);
      setStatus("Showing matching titles from the OMDb results included with this project. Deploy to Netlify for live searches.", "empty");
    } else {
      totalResults = 0;
      grid.replaceChildren();
      resultsCount.textContent = "";
      sectionKicker.textContent = "A little something for your search";
      moviesHeading.firstChild.textContent = `Search results for “${title}” `;
      setStatus("Live searches for other titles need the Netlify Function. Deploy this project to Netlify or run it with Netlify Dev.", "error");
    }
    details.hidden = true;
    return;
  }

  totalResults = 0;
  grid.replaceChildren();
  resultsCount.textContent = "";
  sectionKicker.textContent = "A little something for your search";
  moviesHeading.firstChild.textContent = `Search results for “${title}” `;
  setStatus(`Finding movies for “${title}”…`, "loading");
  searchController = new AbortController();

  try {
    const data = await requestMovies({ s: title, type: "movie", page: "1" }, searchController.signal);
    if (data.Response === "False") {
      totalResults = 0;
      renderMovies([], title);
      return;
    }

    totalResults = Number.parseInt(data.totalResults, 10) || 0;
    renderMovies(Array.isArray(data.Search) ? data.Search : [], title);
  } catch (error) {
    if (error.name === "AbortError") return;
    grid.replaceChildren();
    resultsCount.textContent = "";
    setStatus(error.message || "We couldn't find movies right now. Please try again.", "error");
  }
}

function addFact(list, label, value) {
  if (!value || value === "N/A") return;
  const item = document.createElement("div");
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  item.append(term, description);
  list.append(item);
}

function renderDetails(data, fallbackTitle = "") {
  const poster = document.querySelector("#details-poster-wrap");
  poster.replaceChildren();
  poster.classList.remove("poster-missing");

  if (data.Poster && data.Poster !== "N/A") {
    const image = document.createElement("img");
    image.className = "details-poster";
    image.src = data.Poster;
    image.alt = `${data.Title || fallbackTitle} poster`;
    poster.append(image);
  } else {
    poster.classList.add("poster-missing");
    poster.textContent = "✦";
  }

  document.querySelector("#details-title").textContent = data.Title || fallbackTitle;
  document.querySelector("#details-meta").textContent =
    [data.Year, data.Runtime !== "N/A" ? data.Runtime : "", data.Genre !== "N/A" ? data.Genre : ""]
      .filter(Boolean)
      .join("  ·  ");
  document.querySelector("#details-rating").textContent =
    data.imdbRating && data.imdbRating !== "N/A"
      ? `★ ${data.imdbRating} / 10 on IMDb${data.imdbVotes && data.imdbVotes !== "N/A" ? ` · ${data.imdbVotes} ratings` : ""}`
      : "IMDb rating not available";
  document.querySelector("#details-overview").textContent =
    data.Plot && data.Plot !== "N/A"
      ? data.Plot
      : "Deploy this project to Netlify to load the full movie details from OMDb.";

  const facts = document.querySelector("#details-facts");
  facts.replaceChildren();
  addFact(facts, "Director", data.Director);
  addFact(facts, "Cast", data.Actors);
  addFact(facts, "Released", data.Released);
  addFact(facts, "Language", data.Language);
}

async function showMovieDetails(movie) {
  if (detailsController) detailsController.abort();
  details.hidden = false;
  details.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#details-title").textContent = "Loading movie details…";
  document.querySelector("#details-meta").textContent = "";
  document.querySelector("#details-rating").textContent = "";
  document.querySelector("#details-overview").textContent = "";
  document.querySelector("#details-facts").replaceChildren();

  if (isLocalPreview()) {
    renderDetails(movie);
    return;
  }

  detailsController = new AbortController();
  try {
    const data = await requestMovies({ i: movie.imdbID }, detailsController.signal);
    renderDetails(data, movie.Title);
  } catch (error) {
    if (error.name === "AbortError") return;
    document.querySelector("#details-title").textContent = "Movie details unavailable";
    document.querySelector("#details-overview").textContent =
      error.message || "We couldn't load details for this film.";
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  scheduleSearch(queryInput.value);
});

function scheduleSearch(query) {
  clearTimeout(searchTimer);
  if (searchController) searchController.abort();

  if (!query.trim()) {
    clearSearchResults();
    return;
  }

  details.hidden = true;
  sectionKicker.textContent = "A little something for your search";
  moviesHeading.firstChild.textContent = `Search results for “${query.trim()}” `;
  setStatus(`Searching for “${query.trim()}”…`, "loading");
  searchTimer = setTimeout(() => searchMovies(query), SEARCH_DELAY);
}

queryInput.addEventListener("input", () => {
  scheduleSearch(queryInput.value);
});

document.querySelector("#details-close").addEventListener("click", () => {
  details.hidden = true;
  if (detailsController) detailsController.abort();
});

clearSearchResults();
