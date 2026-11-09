import React from "react";

export function SearchBar({ query, onQueryChange }) {
  function handleSearch(event) {
    event.preventDefault();
    onQueryChange(query.trim());
  }

  return (
    <>
      <form className="search-form" role="search" onSubmit={handleSearch}>
        <label className="visually-hidden" htmlFor="movie-query">Search movies by title</label>
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          id="movie-query"
          name="query"
          type="search"
          placeholder="What are you in the mood for?"
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button type="submit">Search <span aria-hidden="true">→</span></button>
      </form>
      <p className="search-hint">Type a movie title to find its poster, rating, and details.</p>
    </>
  );
}

export default function Nav({ query, onQueryChange }) {
  return (
    <header className="site-header" id="top">
      <a className="brand" href="#top" aria-label="The Marquee home">
        <span className="brand-icon" aria-hidden="true">✦</span>
        <span>the <strong>marquee</strong></span>
      </a>
      <div className="header-search">
        <SearchBar query={query} onQueryChange={onQueryChange} />
      </div>
      <div className="header-actions">
        <span className="header-note"><span className="status-dot" aria-hidden="true"></span> Your movie night starts here</span>
      </div>
    </header>
  );
}
