import { FormEvent, useEffect, useMemo, useState } from 'react'
import { IndicatorCard } from './components/IndicatorCard'
import { indicators } from './data/indicators'

const categories = ['Selected', 'All', 'Macro', 'Stocks', 'Commodities', 'Crypto'] as const
type Category = (typeof categories)[number]
const hiddenStorageKey = 'economic-dashboard-hidden-indicators'
const locationStorageKey = 'economic-dashboard-weather-location'

interface GeocodingResult {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

interface GeocodingResponse { results?: GeocodingResult[] }
interface WeatherResponse {
  current?: {
    temperature_2m: number
    apparent_temperature: number
    weather_code: number
  }
}

function categoryClass(category: Category) {
  return `filter-${category.toLowerCase()}`
}

function readHiddenIndicators() {
  try {
    const value = window.localStorage.getItem(hiddenStorageKey)
    const parsed: unknown = value ? JSON.parse(value) : []
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

function readSavedLocation() {
  try {
    return window.localStorage.getItem(locationStorageKey) ?? 'Madrid'
  } catch {
    return 'Madrid'
  }
}

function saveHiddenIndicators(indicatorIds: string[]) {
  try {
    window.localStorage.setItem(hiddenStorageKey, JSON.stringify(indicatorIds))
  } catch {
    // Keep the in-memory selection working if localStorage is unavailable.
  }
}

export default function App() {
  const [category, setCategory] = useState<Category>('Selected')
  const [hiddenIndicatorIds, setHiddenIndicatorIds] = useState<string[]>(readHiddenIndicators)
  const [now, setNow] = useState(() => new Date())
  const [location, setLocation] = useState(readSavedLocation)
  const [locationInput, setLocationInput] = useState(readSavedLocation)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [weather, setWeather] = useState<{ place: string; temperature: number; apparent: number; summary: string } | null>(null)
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const hiddenIndicators = useMemo(() => new Set(hiddenIndicatorIds), [hiddenIndicatorIds])
  const visibleIndicators = useMemo(
    () => indicators.filter((indicator) => {
      if (category === 'All') return true
      if (hiddenIndicators.has(indicator.id)) return false
      return category === 'Selected' || indicator.category === category
    }),
    [category, hiddenIndicators],
  )

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true
    async function loadWeather() {
      setWeatherStatus('loading')
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        const geoResponse = await fetch(geoUrl)
        if (!geoResponse.ok) throw new Error('Location unavailable')
        const geoData: GeocodingResponse = await geoResponse.json()
        const place = geoData.results?.[0]
        if (!place) throw new Error('Location not found')

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`
        const weatherResponse = await fetch(weatherUrl)
        if (!weatherResponse.ok) throw new Error('Weather unavailable')
        const weatherData: WeatherResponse = await weatherResponse.json()
        if (!weatherData.current) throw new Error('Weather unavailable')

        if (!active) return
        setWeather({
          place: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
          temperature: weatherData.current.temperature_2m,
          apparent: weatherData.current.apparent_temperature,
          summary: weatherSummary(weatherData.current.weather_code),
        })
        setWeatherStatus('idle')
      } catch {
        if (!active) return
        setWeather(null)
        setWeatherStatus('error')
      }
    }
    loadWeather()
    return () => { active = false }
  }, [location])

  function toggleIndicatorVisibility(indicatorId: string) {
    setHiddenIndicatorIds((current) => {
      const next = current.includes(indicatorId)
        ? current.filter((item) => item !== indicatorId)
        : [...current, indicatorId]
      saveHiddenIndicators(next)
      return next
    })
  }

  function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextLocation = locationInput.trim()
    if (!nextLocation) return
    setLocation(nextLocation)
    setIsLocationModalOpen(false)
    try {
      window.localStorage.setItem(locationStorageKey, nextLocation)
    } catch {
      // The typed location still works for the current session.
    }
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)
  const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(now)

  return (
    <main className="page-shell">
      <section className="start-panel" aria-label="Start page summary">
        <div className="time-block">
          <p className="start-day">{weekday}</p>
          <p className="start-time">{time}</p>
        </div>
        <div className="weather-card">
          <span className="weather-icon" aria-hidden="true">{weatherIcon(weather?.summary)}</span>
          <div>
            <p className="weather-label">Weather</p>
            <p className="weather-value">{weather ? `${Math.round(weather.temperature)}°C` : weatherStatus === 'loading' ? 'Loading…' : 'Unavailable'}</p>
            {weather && <p className="weather-detail">{weather.summary} · feels {Math.round(weather.apparent)}°C</p>}
          </div>
          <button className="location-trigger" type="button" onClick={() => setIsLocationModalOpen(true)}>
            <span>{weather?.place ?? location}</span>
            Change
          </button>
        </div>
      </section>

      {isLocationModalOpen && <div className="location-modal" role="dialog" aria-modal="true" aria-label="Change weather location" onClick={() => setIsLocationModalOpen(false)}>
        <form className="location-modal-panel" onSubmit={saveLocation} onClick={(event) => event.stopPropagation()}>
          <label htmlFor="weather-location">Weather location</label>
          <input id="weather-location" autoFocus value={locationInput} onChange={(event) => setLocationInput(event.target.value)} />
          <div>
            <button type="button" onClick={() => setIsLocationModalOpen(false)}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>}
      <nav className="filters" aria-label="Indicator categories">
        {categories.map((item) => (
          <button className={`${categoryClass(item)}${category === item ? ' active' : ''}`} key={item} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </nav>

      <section className="indicator-grid" aria-label={`${category} economic indicators`}>
        {visibleIndicators.map((indicator) => <IndicatorCard
          key={indicator.id}
          indicator={indicator}
          isHidden={hiddenIndicators.has(indicator.id)}
          onVisibilityToggle={() => toggleIndicatorVisibility(indicator.id)}
        />)}
      </section>
    </main>
  )
}

function weatherSummary(code: number) {
  if (code === 0) return 'Clear'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Storm'
  return 'Cloudy'
}

function weatherIcon(summary?: string) {
  if (summary === 'Clear') return '☀'
  if (summary === 'Partly cloudy') return '◐'
  if (summary === 'Fog') return '≋'
  if (summary === 'Drizzle') return '☂'
  if (summary === 'Rain') return '☔'
  if (summary === 'Snow') return '❄'
  if (summary === 'Storm') return 'ϟ'
  return '☁'
}
