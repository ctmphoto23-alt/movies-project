# The Marquee

The site is hosted on GitHub Pages. Live title search and movie details use the Cloudflare Worker at [`marquee-movie-search.ctmphoto23.workers.dev`](https://marquee-movie-search.ctmphoto23.workers.dev), which keeps the OMDb API key private.

## Set up live movie search

1. In Cloudflare, open the Worker’s **Settings → Variables and Secrets** and add a Secret named `OMDB_API_KEY`. Enter your existing OMDb key as the secret value. Never put the key in `script.js` or another public file.
2. If you recreate the Worker, use the code in [`cloudflare/worker.js`](./cloudflare/worker.js), set the `OMDB_API_KEY` secret, and deploy.
3. Keep the `API_ROOT` in [`script.js`](./script.js) set to the Worker’s `workers.dev` URL.
4. Publish the updated site files to the GitHub Pages branch and wait for the Pages deployment to finish.
5. Test a movie title on the live site, or open <https://marquee-movie-search.ctmphoto23.workers.dev/?s=Inception>. A JSON movie search response confirms the Worker is reachable.

If you prefer the command line, from this project directory run:

```sh
npx wrangler login
npx wrangler deploy
npx wrangler secret put OMDB_API_KEY
npx wrangler deploy
```

Wrangler prints the Worker URL after deployment. Set `API_ROOT` in `script.js` to that URL and publish the site to GitHub Pages. The secret command prompts for the key privately; do not paste it into chat or commit it.

Until the Worker URL is configured, the site continues to show its bundled Fast & Furious titles where they match the search.
