# Economic Dashboard

A dashboard to quickly see the latest economic indicators at a glance:

- Brent price
- SP500 & co.
- Nikkei, DAX, IBEX...
- Gold
- Liquidity
- Bitcoin
- Available oil reserves

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The starter uses illustrative seed values; see [the architecture notes](docs/architecture.md) for the data boundary to replace when connecting a live market-data provider.

## Historical data

Run `npm run fetch:history` to download plot-ready history into `public/data/history/`, with one JSON file per tracked indicator. Existing observations are preserved: only missing time buckets are requested and periods with no source value are remembered.

The collector requests history as far back as 1950. It retains monthly values before the current year, weekly values during the current year, and daily values in the current week. Sources with shorter histories simply begin at their first available observation. Market data comes from Yahoo Finance; the US M2 proxy from FRED; and the Strategic Petroleum Reserve from EIA.
