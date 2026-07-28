import { useEffect, useState } from 'react'
import type { Indicator } from '../types'
import { HistoryChart } from './HistoryChart'

const trendSymbol = { up: '↑', down: '↓', flat: '—' }

interface HistoryPoint { date: string; value: number }
interface HistoryFile { points: HistoryPoint[] }

function formatLatestValue(indicator: Indicator, value: number) {
  if (indicator.id === 'liquidity') {
    return `$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1_000)}T`
  }

  if (indicator.id === 'oil-reserves') {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1_000)}M bbl`
  }

  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: indicator.id === 'bitcoin' ? 0 : 2,
    minimumFractionDigits: indicator.id === 'bitcoin' ? 0 : 2,
  }).format(value)

  return indicator.value.startsWith('$') ? `$${formatted}` : formatted
}

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const [history, setHistory] = useState<HistoryPoint[] | null>(null)
  const latestPoint = history?.at(-1)
  const shownValue = latestPoint ? formatLatestValue(indicator, latestPoint.value) : indicator.value

  useEffect(() => {
    let active = true
    fetch(`/data/history/${indicator.id}.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('History unavailable')))
      .then((data: HistoryFile) => active && setHistory(data.points))
      .catch(() => active && setHistory([]))
    return () => { active = false }
  }, [indicator.id])

  return (
    <article className="indicator-card">
      <div className="card-heading">
        <div>
          <p className="symbol">{indicator.symbol}</p>
          <h3>{indicator.name}</h3>
        </div>
        <span className={`trend trend--${indicator.trend}`} aria-label={`${indicator.trend} trend`}>
          {trendSymbol[indicator.trend]}
        </span>
      </div>
      <div className="value-row">
        <p className="value">{shownValue}</p>
        {latestPoint && <span className="latest-date">as of {latestPoint.date}</span>}
      </div>
      <HistoryChart history={history} label={indicator.name} />
      <div className="card-footer">
        <span className={`change change--${indicator.trend}`}>{indicator.change}</span>
        <span>{indicator.description}</span>
      </div>
    </article>
  )
}
