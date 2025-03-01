'use client'

import { useState, useEffect } from 'react'
import { Command } from "@/components/ui/command"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
]

export function StockSearch({ onSelect }) {
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState(popularStocks)

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults(popularStocks)
      return
    }

    // Filter stocks based on symbol or name
    const filtered = popularStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(filtered)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2 text-sm text-left text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
      >
        Search stocks... (⌘K)
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search stocks..." 
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Popular Stocks">
            {searchResults.map((stock) => (
              <CommandItem
                key={stock.symbol}
                onSelect={() => {
                  onSelect(stock.symbol)
                  setOpen(false)
                }}
              >
                <span className="font-bold">{stock.symbol}</span>
                <span className="ml-2 text-gray-500">{stock.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
