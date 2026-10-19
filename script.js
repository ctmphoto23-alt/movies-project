const API_ROOT = "/.netlify/functions/movies";
const GITHUB_API_ROOT = "https://moviesfesnew.netlify.app/.netlify/functions/movies";
const searchForm = document.querySelector("#search-form");
const queryInput = document.querySelector("#movie-query");
const grid = document.querySelector("#movie-grid");
const statusMessage = document.querySelector("#status-message");
const resultsCount = document.querySelector("#results-count");
const sortOrder = document.querySelector("#sort-order");
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

let searchTimer;
let searchController;
let detailsController;
let totalResults = 0;
let currentMovies = [];
const directorCache = new Map();

function isStaticPreview() {
  return window.location.protocol === "file:";
}

function isGitHubPages() {
  return window.location.hostname.endsWith(".github.io");
}

function isLocalServer() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function getLocalMatches(query) {
  const normalizedQuery = query.toLocaleLowerCase();
  return initialMovies.filter((movie) =>
    movie.Title.toLocaleLowerCase().includes(normalizedQuery));
}

async function requestMovies(params, signal) {
  if (isStaticPreview()) {
    throw new Error("Live movie search needs the Netlify Function. Use the Netlify site or run this project with Netlify Dev.");
  }

  const apiRoot = isGitHubPages() ? GITHUB_API_ROOT : API_ROOT;
  const url = new URL(apiRoot, window.location.href);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { signal });
  if (response.status === 404 && (isLocalServer() || isGitHubPages())) {
    const error = new Error("Netlify Functions aren't running here.");
    error.code = "LOCAL_FUNCTION_MISSING";
    throw error;
  }
  let data;

  try {
    data = await response.json();
  } catch {
    if (response.status === 404 && (isLocalServer() || isGitHubPages())) {
      throw new Error("Netlify Functions aren't running here. Start the project with Netlify Dev to search movies locally.");
    }
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
    }, { once: true });
    posterWrap.append(poster);
  } else {
    posterWrap.classList.add("poster-missing");
    posterWrap.textContent = "✦";
  }

  const directorLabel = document.createElement("span");
  directorLabel.className = "card-director";
  directorLabel.textContent = "Loading director…";
  posterWrap.append(directorLabel);

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

  let hoverTimer;
  const showDirector = () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(async () => {
      directorLabel.textContent = `Directed by ${await getDirector(movie)}`;
      if (card.matches(":hover, :focus-visible")) {
        card.classList.add("show-director");
      }
    }, 250);
  };
  const hideDirector = () => {
    clearTimeout(hoverTimer);
    card.classList.remove("show-director");
  };
  card.addEventListener("pointerenter", showDirector);
  card.addEventListener("pointerleave", hideDirector);
  card.addEventListener("focus", showDirector);
  card.addEventListener("blur", hideDirector);
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
  currentMovies = [];
  grid.replaceChildren();
  resultsCount.textContent = "";
  sectionKicker.textContent = "Find your next favorite";
  moviesHeading.firstChild.textContent = "Search by movie title ";
  setStatus("");
}

function setSearchHeading(query, local = false) {
  sectionKicker.textContent = local ? "From your OMDb search" : "A little something for your search";
  moviesHeading.firstChild.textContent = `Search results for “${query}” `;
}

function renderMovies(movies, query) {
  currentMovies = movies;
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
  if (comparators[sortOrder.value]) sortedMovies.sort(comparators[sortOrder.value]);

  const visibleMovies = sortedMovies.slice(0, MAX_VISIBLE_MOVIES);
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

  if (isStaticPreview()) {
    const localMatches = getLocalMatches(title);
    totalResults = localMatches.length;
    setSearchHeading(title, true);
    renderMovies(localMatches, title);
    setStatus(
      localMatches.length
        ? "Showing the movie titles included with this project. Use its Netlify site for live OMDb searches."
        : "No included titles match. Use the Netlify site for live OMDb searches.",
      localMatches.length ? "empty" : "error",
    );
    return;
  }

  totalResults = 0;
  currentMovies = [];
  grid.replaceChildren();
  resultsCount.textContent = "";
  setSearchHeading(title);
  setStatus(`Finding movies for “${title}”…`, "loading");
  searchController = new AbortController();

  try {
    const data = await requestMovies({ s: title, type: "movie" }, searchController.signal);
    if (data.Response === "False") {
      totalResults = 0;
      renderMovies([], title);
      return;
    }

    totalResults = Number.parseInt(data.totalResults, 10) || 0;
    renderMovies(Array.isArray(data.Search) ? data.Search : [], title);
  } catch (error) {
    if (error.name === "AbortError") return;
    if (error.code === "LOCAL_FUNCTION_MISSING") {
      const localMatches = getLocalMatches(title);
      totalResults = localMatches.length;
      renderMovies(localMatches, title);
      setStatus(
        localMatches.length
          ? "Showing the movie titles included with this project. Run with Netlify Dev or use the Netlify site for live OMDb searches."
          : "No included titles match. Run with Netlify Dev or use the Netlify site for live OMDb searches.",
        localMatches.length ? "empty" : "error",
      );
      return;
    }
    if (isGitHubPages() && error instanceof TypeError) {
      const localMatches = getLocalMatches(title);
      totalResults = localMatches.length;
      renderMovies(localMatches, title);
      setStatus(
        localMatches.length
          ? "Live OMDb search is unavailable. Showing included titles; deploy the Netlify site to search all movies."
          : "Live OMDb search is unavailable, and no included titles match. Deploy the Netlify site to search all movies.",
        localMatches.length ? "empty" : "error",
      );
      return;
    }
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
      : "Run this project with Netlify Dev or deploy to Netlify to load the full movie details from OMDb.";

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

  if (isStaticPreview()) {
    renderDetails(movie);
    return;
  }

  detailsController = new AbortController();
  try {
    const data = await requestMovies({ i: movie.imdbID }, detailsController.signal);
    renderDetails(data, movie.Title);
  } catch (error) {
    if (error.name === "AbortError") return;
    if (error.code === "LOCAL_FUNCTION_MISSING" || (isGitHubPages() && error instanceof TypeError)) {
      renderDetails(movie);
      document.querySelector("#details-overview").textContent =
        "Full movie details are available through the Netlify site or when running this project with Netlify Dev.";
      return;
    }
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

sortOrder.addEventListener("change", () => {
  if (currentMovies.length) {
    renderMovies(currentMovies, queryInput.value.trim());
  }
});

function scheduleSearch(query) {
  clearTimeout(searchTimer);
  if (searchController) searchController.abort();

  if (!query.trim()) {
    clearSearchResults();
    return;
  }
  details.hidden = true;
  details.hidden = true;
  setSearchHeading(query.trim());
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
