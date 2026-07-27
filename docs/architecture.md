# Architecture

The application is a Vite-powered React single page app written in TypeScript.

- `src/App.tsx` owns dashboard state, including category filtering.
- `src/components/` contains reusable presentation components.
- `src/data/indicators.ts` is the current data boundary. Replace its seed data with a provider client, cache, or backend API when live figures are required.
- `src/types.ts` defines the shared indicator contract.
- `scripts/fetch-history.mjs` retrieves and compacts historical observations into `data/history/`.

Keeping fetching outside the card components makes it straightforward to add loading, error, and refresh states without changing the visual layer.
