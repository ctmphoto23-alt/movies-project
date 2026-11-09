import React, { useState } from "react";
import Home from "../pages/home.jsx";
import Layout from "../components/Layout.jsx";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <Layout query={query} onQueryChange={setQuery}>
      <Home query={query} />
    </Layout>
  );
}
