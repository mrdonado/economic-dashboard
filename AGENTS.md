# AGENTS.md

## Project overview

This repository is a Vite-powered React single-page application written in TypeScript. It presents a compact economic dashboard for market, commodity, and macroeconomic indicators.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start the Vite development server.
- `npm run check` — run the TypeScript type checker.
- `npm run build` — type-check and create a production build.
- `npm run preview` — serve the production build locally.

Run `npm run build` after changes that affect application code or configuration.

## Code structure

- `src/App.tsx` contains page-level state and composition.
- `src/components/` contains reusable UI components.
- `src/data/` is the boundary for seed data and future market-data integrations.
- `src/types.ts` defines shared application types.
- `src/styles.css` contains the global styling and responsive layout.

## Contribution guidelines

- Use TypeScript strictly; do not introduce `any` unless there is a documented reason.
- Keep UI components focused on presentation. Fetching and data transformation belong outside card components.
- Maintain responsive behavior for mobile, tablet, and desktop breakpoints.
- Use semantic HTML and preserve accessible labels for controls and status information.
- Keep live-market integrations behind the data boundary so UI components remain provider-agnostic.
- Avoid adding dependencies when a small native React or CSS solution is sufficient.
