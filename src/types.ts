export type Trend = 'up' | 'down' | 'flat'

export interface Indicator {
  id: string
  name: string
  symbol: string
  value: string
  change: string
  trend: Trend
  category: 'Markets' | 'Commodities' | 'Macro'
  description: string
}
