import type { Indicator } from '../types'

const trendSymbol = { up: '↑', down: '↓', flat: '—' }

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
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
      <p className="value">{indicator.value}</p>
      <div className="card-footer">
        <span className={`change change--${indicator.trend}`}>{indicator.change}</span>
        <span>{indicator.description}</span>
      </div>
    </article>
  )
}
