import { useEffect, useState } from 'react'
import type { Indicator } from '../types'
import { HistoryChart } from './HistoryChart'

const trendSymbol = { up: '↑', down: '↓', flat: '—' }

interface HistoryPoint { date: string; value: number }
interface HistoryFile { points: HistoryPoint[] }

function formatLatestValue(indicator: Indicator, value: number) {
  if (indicator.id.startsWith('fear-greed-')) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)}/100`
  }

  if (indicator.id === 'liquidity') {
    return `$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1_000)}T`
  }

  if (indicator.id === 'oil-reserves') {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1_000)}M bbl`
  }

  if (['us10y', 'cpi-yoy', 'unemployment'].includes(indicator.id)) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)}%`
  }

  if (['yield-spread', 'hy-spread'].includes(indicator.id)) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)} pp`
  }

  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: indicator.id === 'bitcoin' ? 0 : 2,
    minimumFractionDigits: indicator.id === 'bitcoin' ? 0 : 2,
  }).format(value)

  return indicator.value.startsWith('$') ? `$${formatted}` : formatted
}

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const [history, setHistory] = useState<HistoryPoint[] | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
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

  useEffect(() => {
    if (!expanded) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeExpanded()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [expanded])

  function openExpanded() {
    setClosing(false)
    setExpanded(true)
  }

  function closeExpanded() {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      setExpanded(false)
      setClosing(false)
    }, 220)
  }

  return (
    <>
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
          {latestPoint && <span className="latest-date">{latestPoint.date}</span>}
        </div>
        <HistoryChart compact history={history} label={indicator.name} onOpen={openExpanded} />
      </article>

      {expanded && <div className={`chart-modal${closing ? ' chart-modal--closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${indicator.name} expanded chart`} onClick={closeExpanded}>
        <div className="chart-modal-panel" onClick={(event) => event.stopPropagation()}>
          <div className="chart-modal-heading">
            <div>
              <p className="symbol">{indicator.symbol}</p>
              <h2>{indicator.name}</h2>
              <p>{indicator.description}</p>
            </div>
            <button className="modal-close" type="button" aria-label="Close expanded chart" onClick={closeExpanded}>Close</button>
          </div>
          <div className="modal-latest">
            <span>Latest value</span>
            <strong>{shownValue}</strong>
            {latestPoint && <small>{latestPoint.date}</small>}
          </div>
          <div className="modal-stats">
            <span className={`change change--${indicator.trend}`}>{indicator.change}</span>
          </div>
          <HistoryChart history={history} label={indicator.name} />
        </div>
      </div>}
    </>
  )
}
