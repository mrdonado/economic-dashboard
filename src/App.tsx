import { useMemo, useState } from 'react'
import { IndicatorCard } from './components/IndicatorCard'
import { indicators } from './data/indicators'

const categories = ['All', 'Macro', 'Markets', 'Commodities'] as const
type Category = (typeof categories)[number]

export default function App() {
  const [category, setCategory] = useState<Category>('All')
  const visibleIndicators = useMemo(
    () => indicators.filter((indicator) => category === 'All' || indicator.category === category),
    [category],
  )

  return (
    <main className="page-shell">
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
    </main>
  )
}
