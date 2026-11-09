# The Marquee

The Marquee is a React app built with Vite. It searches for movies using a Cloudflare Worker, which keeps the OMDb API key private.

## Source structure

- `pages/home.jsx` contains the home page, search state, and results.
- `pages/movie.jsx` contains movie details.
- `components/MovieCard.jsx` contains movie cards, their loading skeleton, and movie-data helpers.
- `components/Nav.jsx` contains the site navigation and search bar; `components/Footer.jsx` contains the footer.
- `components/Layout.jsx` assembles the navigation, page content, and footer.
- `src/App.jsx` renders the layout and home page.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; Vite writes the static site to `dist/`. To check the build locally, run `npm run preview`.

## Set up live movie search

1. In Cloudflare, open the Worker’s **Settings → Variables and Secrets** and add a Secret named `OMDB_API_KEY`. Enter your existing OMDb key as the secret value. Never put the key in a public file.
2. If you recreate the Worker, use the code in [`cloudflare/worker.js`](./cloudflare/worker.js), set the `OMDB_API_KEY` secret, and deploy.
3. Keep the Worker URL in `API_ROOT` in [`components/MovieCard.jsx`](./components/MovieCard.jsx) set to your deployed `workers.dev` URL.
4. Publish the contents of `dist/` to GitHub Pages after running `npm run build`.
5. Test a movie title on the live site, or open <https://marquee-movie-search.ctmphoto23.workers.dev/?s=Inception>. A JSON movie search response confirms the Worker is reachable.

If you prefer the command line, from this project directory run:

```sh
npx wrangler login
npx wrangler deploy
npx wrangler secret put OMDB_API_KEY
npx wrangler deploy
```

Wrangler prints the Worker URL after deployment. Update `API_ROOT` in `components/MovieCard.jsx` and publish the new `dist/` build to GitHub Pages. The secret command prompts for the key privately; do not paste it into chat or commit it.

If the Worker is unavailable, the app still searches its bundled Fast & Furious titles where they match the search.
