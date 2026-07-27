import { useEffect, useMemo, useState } from 'react'

type Range = '1M' | '6M' | 'YTD' | '5Y' | 'Max'

interface HistoryPoint { date: string; value: number }
interface HistoryFile { points: HistoryPoint[] }

const ranges: Range[] = ['1M', '6M', 'YTD', '5Y', 'Max']

function startFor(range: Range, end: Date) {
  const start = new Date(end)
  if (range === '1M') start.setMonth(start.getMonth() - 1)
  if (range === '6M') start.setMonth(start.getMonth() - 6)
  if (range === 'YTD') start.setMonth(0, 1)
  if (range === '5Y') start.setFullYear(start.getFullYear() - 5)
  return start
}

function linePath(points: HistoryPoint[]) {
  if (points.length < 2) return ''
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100
    const y = 46 - ((point.value - min) / span) * 42
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

export function HistoryChart({ indicatorId, label }: { indicatorId: string; label: string }) {
  const [range, setRange] = useState<Range>('6M')
  const [history, setHistory] = useState<HistoryPoint[] | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/data/history/${indicatorId}.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('History unavailable')))
      .then((data: HistoryFile) => active && setHistory(data.points))
      .catch(() => active && setHistory([]))
    return () => { active = false }
  }, [indicatorId])

  const points = useMemo(() => {
    if (!history?.length) return []
    const end = new Date(`${history.at(-1)?.date}T00:00:00Z`)
    const start = startFor(range, end)
    return range === 'Max' ? history : history.filter((point) => new Date(`${point.date}T00:00:00Z`) >= start)
  }, [history, range])
  const path = useMemo(() => linePath(points), [points])
  const movement = points.length > 1 ? points[points.length - 1].value - points[0].value : 0
  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex]
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const hoveredX = hoveredIndex === null || points.length < 2 ? 0 : (hoveredIndex / (points.length - 1)) * 100
  const hoveredY = hoveredPoint ? 46 - ((hoveredPoint.value - min) / (max - min || 1)) * 42 : 0

  function selectNearestPoint(clientX: number, element: SVGSVGElement) {
    const bounds = element.getBoundingClientRect()
    const position = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
    setHoveredIndex(Math.round(position * (points.length - 1)))
  }

  return (
    <div className="history-chart">
      <div className="range-picker" aria-label={`${label} chart period`}>
        {ranges.map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}
      </div>
      {history === null ? <div className="chart-message">Loading history…</div>
        : points.length < 2 ? <div className="chart-message">No history for this period</div>
          : <div className="chart-plot">
            <svg
              viewBox="0 0 100 50"
              role="img"
              aria-label={`${label}, ${range} historical chart`}
              preserveAspectRatio="none"
              onMouseMove={(event) => selectNearestPoint(event.clientX, event.currentTarget)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <path className="chart-grid" d="M 0 12 H 100 M 0 29 H 100 M 0 46 H 100" />
              <path className={movement >= 0 ? 'chart-line positive' : 'chart-line negative'} d={path} />
              {hoveredPoint && <>
                <path className="chart-guide" d={`M ${hoveredX} 0 V 50`} />
                <circle className={movement >= 0 ? 'chart-marker positive' : 'chart-marker negative'} cx={hoveredX} cy={hoveredY} r="2.1" />
              </>}
            </svg>
            {hoveredPoint && <div className="chart-tooltip" style={{ left: `${hoveredX}%` }}>
              <strong>{new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(hoveredPoint.value)}</strong>
              <span>{hoveredPoint.date}</span>
            </div>}
          </div>}
      {points.length > 1 && <div className="chart-dates"><span>{points[0].date}</span><span>{points.at(-1)?.date}</span></div>}
    </div>
  )
}
