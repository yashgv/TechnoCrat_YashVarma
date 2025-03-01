'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const markets = [
  { id: 'US', name: 'US Market', exchanges: ['NASDAQ', 'NYSE'] },
  { id: 'IN', name: 'Indian Market', exchanges: ['NSE', 'BSE'] },
  { id: 'UK', name: 'UK Market', exchanges: ['LSE'] },
  { id: 'JP', name: 'Japanese Market', exchanges: ['JPX'] },
]

export function MarketSelector({ selectedMarket, onMarketChange }) {
  return (
    <div className="flex gap-4">
      <Select value={selectedMarket?.id} onValueChange={(value) => 
        onMarketChange(markets.find(m => m.id === value))
      }>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Market" />
        </SelectTrigger>
        <SelectContent>
          {markets.map((market) => (
            <SelectItem key={market.id} value={market.id}>
              {market.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
