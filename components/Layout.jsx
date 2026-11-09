import React from "react";
import Footer from "./Footer.jsx";
import Nav from "./Nav.jsx";

export default function Layout({ children, query, onQueryChange }) {
  return (
    <>
      <Nav query={query} onQueryChange={onQueryChange} />
      {children}
      <Footer />
    </>
  );
}
