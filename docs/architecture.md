# Architecture

The application is a Vite-powered React single page app written in TypeScript.

- `src/App.tsx` owns dashboard state, including category filtering.
- `src/components/` contains reusable presentation components.
- `src/data/indicators.ts` defines card metadata; latest values and chart history are loaded from bundled JSON files in `public/data/history/`.
- `src/types.ts` defines the shared indicator contract.
- `scripts/fetch-history.mjs` retrieves and compacts historical observations into `public/data/history/`, where the dashboard can load them as static assets.

Keeping fetching outside the card components makes it straightforward to add loading, error, and refresh states without changing the visual layer.
