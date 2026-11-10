import React, { useEffect, useState } from "react";
import Home from "../pages/home.jsx";
import MovieDetails from "../pages/movie.jsx";
import Layout from "../components/Layout.jsx";

export default function App() {
  const [query, setQuery] = useState("");
  const [hash, setHash] = useState(() => window.location.hash);
  const movieRoute = hash.startsWith("#/movie/");
  const movieId = movieRoute ? hash.slice("#/movie/".length) : "";

  useEffect(() => {
    function handleHashChange() {
      setHash(window.location.hash);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function handleQueryChange(value) {
    setQuery(value);
    if (movieRoute) window.location.hash = "top";
  }

  return (
    <Layout query={query} onQueryChange={handleQueryChange}>
      {movieRoute ? <MovieDetails key={movieId} movieId={movieId} /> : <Home query={query} />}
    </Layout>
  );
}
