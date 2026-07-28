import type { Indicator } from '../types'

// Card metadata is paired with latest values loaded from public/data/history.
export const indicators: Indicator[] = [
  { id: 'brent', name: 'Brent crude', symbol: 'BZ=F', value: '$82.34', change: '+0.68%', trend: 'up', category: 'Commodities', description: 'Global oil benchmark' },
  { id: 'gold', name: 'Gold', symbol: 'GC=F', value: '$2,336.10', change: '+0.24%', trend: 'up', category: 'Commodities', description: 'Spot price per troy ounce' },
  { id: 'silver', name: 'Silver', symbol: 'SI=F', value: '$29.52', change: '+0.31%', trend: 'up', category: 'Commodities', description: 'Futures price per troy ounce' },
  { id: 'sp500', name: 'S&P 500', symbol: '^GSPC', value: '5,487.03', change: '+0.15%', trend: 'up', category: 'Markets', description: 'US large-cap equities' },
  { id: 'nikkei', name: 'Nikkei 225', symbol: '^N225', value: '38,804.65', change: '-0.36%', trend: 'down', category: 'Markets', description: 'Japanese equities' },
  { id: 'dax', name: 'DAX', symbol: '^GDAXI', value: '18,374.53', change: '+0.41%', trend: 'up', category: 'Markets', description: 'German equities' },
  { id: 'ibex', name: 'IBEX 35', symbol: '^IBEX', value: '11,023.40', change: '-0.12%', trend: 'down', category: 'Markets', description: 'Spanish equities' },
  { id: 'fear-greed-stocks', name: 'Stock Fear & Greed', symbol: 'CNN F&G', value: '38/100', change: 'Fear', trend: 'down', category: 'Markets', description: 'US equity market sentiment' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC-USD', value: '$66,235', change: '+1.87%', trend: 'up', category: 'Markets', description: 'Bitcoin / US dollar' },
  { id: 'fear-greed-crypto', name: 'Crypto Fear & Greed', symbol: 'FNG', value: '29/100', change: 'Fear', trend: 'down', category: 'Markets', description: 'Crypto market sentiment' },
  { id: 'liquidity', name: 'US liquidity', symbol: 'M2SL', value: '$23.1T', change: '+2.1% YoY', trend: 'up', category: 'Macro', description: 'US M2 money stock' },
  { id: 'oil-reserves', name: 'Oil reserves', symbol: 'SPR', value: '365.1M bbl', change: '-1.4M', trend: 'down', category: 'Macro', description: 'US strategic petroleum reserve' },
]
