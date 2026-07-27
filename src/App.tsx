import { useMemo, useState } from 'react'
import { IndicatorCard } from './components/IndicatorCard'
import { indicators } from './data/indicators'

const categories = ['All', 'Markets', 'Commodities', 'Macro'] as const
type Category = (typeof categories)[number]

export default function App() {
  const [category, setCategory] = useState<Category>('All')
  const visibleIndicators = useMemo(
    () => indicators.filter((indicator) => category === 'All' || indicator.category === category),
    [category],
  )

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">MARKET PULSE</p>
          <h1>Economic dashboard</h1>
          <p className="subtitle">A focused view of the signals that move the world economy.</p>
        </div>
        <div className="updated"><span className="status-dot" />Sample data · Updated today</div>
      </header>

      <nav className="filters" aria-label="Indicator categories">
        {categories.map((item) => (
          <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </nav>

      <section className="indicator-grid" aria-label={`${category} economic indicators`}>
        {visibleIndicators.map((indicator) => <IndicatorCard key={indicator.id} indicator={indicator} />)}
      </section>

      <footer>Data values are illustrative. Connect a provider in <code>src/data/indicators.ts</code> to display live figures.</footer>
    </main>
  )
}
