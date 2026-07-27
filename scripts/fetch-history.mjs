#!/usr/bin/env node

/**
 * Builds compact, plot-ready historical series without rewriting existing data.
 *
 * Data is bucketed as follows: monthly before this year, weekly for this year
 * (except the current ISO week), and daily during the current ISO week.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_DIR = join(ROOT, 'public', 'data', 'history')
const START_DATE = '1950-01-01'
const TODAY = isoDate(new Date())

// Yahoo Finance supplies traded instruments. FRED supplies the liquidity proxy;
// the SPR series comes directly from the EIA's public weekly-stocks API.
const SERIES = [
  { id: 'brent', label: 'Brent crude', source: 'yahoo', symbol: 'BZ=F', unit: 'USD/barrel' },
  { id: 'gold', label: 'Gold', source: 'yahoo', symbol: 'GC=F', unit: 'USD/troy ounce' },
  { id: 'sp500', label: 'S&P 500', source: 'yahoo', symbol: '^GSPC', unit: 'index points' },
  { id: 'nikkei', label: 'Nikkei 225', source: 'yahoo', symbol: '^N225', unit: 'index points' },
  { id: 'dax', label: 'DAX', source: 'yahoo', symbol: '^GDAXI', unit: 'index points' },
  { id: 'ibex', label: 'IBEX 35', source: 'yahoo', symbol: '^IBEX', unit: 'index points' },
  { id: 'bitcoin', label: 'Bitcoin', source: 'yahoo', symbol: 'BTC-USD', unit: 'USD' },
  { id: 'liquidity', label: 'US M2 money stock', source: 'fred', symbol: 'M2SL', unit: 'billions USD' },
  { id: 'oil-reserves', label: 'US Strategic Petroleum Reserve', source: 'eia', symbol: 'WCSSTUS1', unit: 'million barrels' },
]

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function mondayOf(date) {
  const value = new Date(`${isoDate(date)}T00:00:00Z`)
  const offset = (value.getUTCDay() + 6) % 7
  value.setUTCDate(value.getUTCDate() - offset)
  return value
}

function bucketFor(date) {
  const year = date.getUTCFullYear()
  const currentYear = new Date(`${TODAY}T00:00:00Z`).getUTCFullYear()
  if (year < currentYear) return isoDate(new Date(Date.UTC(year, date.getUTCMonth(), 1)))

  const thisMonday = mondayOf(new Date(`${TODAY}T00:00:00Z`))
  if (date >= thisMonday) return isoDate(date)
  return isoDate(mondayOf(date))
}

function desiredBuckets() {
  const start = new Date(`${START_DATE}T00:00:00Z`)
  const end = new Date(`${TODAY}T00:00:00Z`)
  const result = new Set()
  for (let date = start; date <= end; date.setUTCDate(date.getUTCDate() + 1)) result.add(bucketFor(date))
  return [...result].sort()
}

const ALL_BUCKETS = desiredBuckets()

async function getJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function yahooObservations(symbol, from) {
  const period1 = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000)
  const period2 = Math.floor((new Date(`${TODAY}T00:00:00Z`).getTime() + 86_400_000) / 1000)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d&events=history`
  const response = await fetch(url, { headers: { 'User-Agent': 'economic-dashboard-history/1.0' } })
  if (!response.ok) throw new Error(`Yahoo request failed (${response.status}) for ${symbol}`)
  const chart = (await response.json()).chart.result?.[0]
  if (!chart) throw new Error(`Yahoo returned no chart data for ${symbol}`)
  return chart.timestamp.map((timestamp, index) => ({
    date: isoDate(new Date(timestamp * 1000)),
    value: chart.indicators.quote[0].close[index],
  })).filter((point) => Number.isFinite(point.value))
}

async function fredObservations(symbol, from) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(symbol)}&cos=Close&coed=${TODAY}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`FRED request failed (${response.status}) for ${symbol}`)
  const lines = (await response.text()).trim().split(/\r?\n/)
  return lines.slice(1).map((line) => {
    const divider = line.indexOf(',')
    return { date: line.slice(0, divider), value: Number(line.slice(divider + 1)) }
  }).filter((point) => point.date >= from && Number.isFinite(point.value))
}

async function eiaObservations(symbol, from) {
  const params = new URLSearchParams({
    api_key: 'DEMO_KEY',
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[series][]': symbol,
    start: from,
    length: '5000',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'asc',
  })
  const response = await fetch(`https://api.eia.gov/v2/petroleum/stoc/wstk/data/?${params}`)
  if (!response.ok) throw new Error(`EIA request failed (${response.status}) for ${symbol}`)
  const payload = await response.json()
  return (payload.response?.data ?? []).map((point) => ({ date: point.period, value: Number(point.value) }))
    .filter((point) => Number.isFinite(point.value))
}

function compact(observations, missing) {
  const newestValueByBucket = new Map()
  for (const point of observations) {
    const bucket = bucketFor(new Date(`${point.date}T00:00:00Z`))
    if (missing.has(bucket)) newestValueByBucket.set(bucket, point)
  }
  return newestValueByBucket
}

async function updateSeries(series) {
  const path = join(OUTPUT_DIR, `${series.id}.json`)
  const existing = await getJson(path, { version: 1, series, points: [], unavailableBuckets: [] })
  const points = new Map(existing.points.map((point) => [point.date, point]))
  const unavailable = new Set(existing.unavailableBuckets ?? [])
  const missing = new Set(ALL_BUCKETS.filter((bucket) => !points.has(bucket) && !unavailable.has(bucket)))

  if (missing.size === 0) {
    console.log(`${series.id}: already complete`)
    return
  }

  const from = [...missing].sort()[0]
  console.log(`${series.id}: requesting ${missing.size} missing buckets from ${from}`)
  const observed = series.source === 'yahoo' ? await yahooObservations(series.symbol, from)
    : series.source === 'fred' ? await fredObservations(series.symbol, from)
      : await eiaObservations(series.symbol, from)
  const found = compact(observed, missing)
  for (const [bucket, point] of found) points.set(bucket, { date: bucket, value: point.value, observedAt: point.date })
  for (const bucket of missing) if (!found.has(bucket)) unavailable.add(bucket)

  const output = {
    version: 1,
    series,
    generatedAt: new Date().toISOString(),
    resolution: { beforeCurrentYear: 'monthly', currentYear: 'weekly', currentWeek: 'daily' },
    points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)),
    unavailableBuckets: [...unavailable].sort(),
  }
  await writeFile(path, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`${series.id}: saved ${found.size} values; ${missing.size - found.size} unavailable buckets recorded`)
}

await mkdir(OUTPUT_DIR, { recursive: true })
const failures = []
for (const series of SERIES) {
  try { await updateSeries(series) } catch (error) {
    failures.push(`${series.id}: ${error.message}`)
    console.error(failures.at(-1))
  }
}
if (failures.length) {
  console.error(`\n${failures.length} series failed. Existing JSON files were left intact.`)
  process.exitCode = 1
}
