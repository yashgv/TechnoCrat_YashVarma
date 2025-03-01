'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TradingViewWidget from './TradingViewWidget'
import { toast } from "@/hooks/use-toast"
import io from 'socket.io-client'
import { StockSearch } from '@/components/StockSearch'
import { Loader2 } from 'lucide-react'
import { MarketSelector } from '@/components/MarketSelector'

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [portfolio, setPortfolio] = useState({ balance: 0, positions: [] }) // Initialize with default values
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true) // Add loading state
  const [marketData, setMarketData] = useState({})
  const [socket, setSocket] = useState(null)
  const userId = "user123"
  const [selectedMarket, setSelectedMarket] = useState({ id: 'US', name: 'US Market', exchanges: ['NASDAQ', 'NYSE'] })
  const [stockDetails, setStockDetails] = useState(null)

  // Initialize from localStorage
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio')
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio))
    }
  }, [])

  // Save to localStorage when portfolio changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio))
  }, [portfolio])

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchPortfolio(), fetchMarketData()])
      } catch (error) {
        console.error('Error initializing data:', error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    setMarketData({
      'large-cap': [],
      'mid-cap': [],
      'small-cap': []
    })
  }, [])

  useEffect(() => {
    if (!socket) {
      const socketIo = io('http://localhost:5000')
      setSocket(socketIo)

      // Subscribe to real-time updates for the selected stock
      socketIo.emit('subscribe', selectedStock)

      // Handle real-time stock updates
      socketIo.on('stock_update', (data) => {
        if (data.symbol === selectedStock) {
          setMarketData(prev => ({
            ...prev,
            [data.symbol]: {
              ...prev[data.symbol],
              price: data.price,
              timestamp: data.timestamp
            }
          }))
        }
      })

      // Handle market category updates
      const categories = ['large-cap', 'mid-cap', 'small-cap']
      categories.forEach(category => {
        socketIo.on(`market_data_${category}`, (data) => {
          if (data && data.stocks) {
            setMarketData(prev => ({
              ...prev,
              [category]: data.stocks
            }))
          }
        })
      })

      return () => {
        socketIo.disconnect()
        setSocket(null)
      }
    }
  }, [selectedStock])

  // Update stock subscription when selected stock changes
  useEffect(() => {
    if (socket) {
      socket.emit('subscribe', selectedStock)
    }
  }, [selectedStock, socket])

  // Add this new effect to fetch stock details when selected
  useEffect(() => {
    if (selectedStock) {
      fetchStockDetails(selectedStock);
    }
  }, [selectedStock]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/portfolio/${userId}`)
      const data = await response.json()
      setPortfolio(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data",
        variant: "destructive",
      })
    }
  }

  const fetchMarketData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/market-data')
      const data = await response.json()
      setMarketData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch market data",
        variant: "destructive",
      })
    }
  }

  const fetchStockDetails = async (symbol) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stock/${symbol}`)
      const data = await response.json()
      setStockDetails(data)
    } catch (error) {
      console.error('Error fetching stock details:', error)
    }
  }

  const executeTrade = async (action) => {
    if (action === 'buy') {
      const totalCost = quantity * (stockDetails?.price || 0)
      if (totalCost > portfolio.balance) {
        toast({
          title: "Insufficient funds",
          description: `You need $${formatCurrency(totalCost)} but have $${formatCurrency(portfolio.balance)}`,
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          symbol: selectedStock,
          quantity,
          action,
        }),
      })
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      await fetchPortfolio()
      toast({
        title: "Success",
        description: `Successfully ${action}ed ${quantity} shares of ${selectedStock}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a helper function for safe number formatting
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '0.00'
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Add a helper function to check for empty positions
  const hasPositions = () => {
    return Array.isArray(portfolio?.positions) && portfolio.positions.length > 0;
  };

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol)
  }

  // Add helper function for safe number formatting with null checks
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0'
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading trading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <MarketSelector 
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
        />
        <div className="flex items-center gap-4">
          <span className="font-bold">Wallet Balance:</span>
          <span className="text-xl text-green-600">${formatCurrency(portfolio?.balance || 0)}</span>
        </div>
      </div>

      <Tabs defaultValue="explore" className="mb-6">
        <TabsList>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="explore">
          <div className="grid grid-cols-12 gap-6">
            {/* Search and Chart Section */}
            <div className="col-span-8">
              <Card className="p-4">
                <div className="mb-4">
                  <StockSearch onSelect={handleStockSelect} />
                </div>
                {selectedStock ? (
                  <div className="h-[600px] w-full">
                    <TradingViewWidget symbol={selectedStock} />
                  </div>
                ) : (
                  <div className="h-[600px] w-full flex items-center justify-center">
                    <p className="text-gray-500">Search and select a stock to view chart</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Trading Panel */}
            <div className="col-span-4">
              <Card className="p-4 mb-6">
                <h3 className="text-lg font-bold mb-4">Trading Panel</h3>
                {stockDetails && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Current Price:</span>
                      <span className="font-bold">${formatCurrency(stockDetails?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Cap:</span>
                      <span>${formatCurrency(stockDetails?.marketCap || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span>{formatNumber(stockDetails?.volume)}</span>
                    </div>
                    {stockDetails?.details && (
                      <>
                        <div className="flex justify-between">
                          <span>P/E Ratio:</span>
                          <span>{formatNumber(stockDetails.details?.pe_ratio)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>52W High:</span>
                          <span>${formatCurrency(stockDetails.details?.week52_high || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>52W Low:</span>
                          <span>${formatCurrency(stockDetails.details?.week52_low || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Available Balance:</span>
                    <span className="font-bold">${formatCurrency(portfolio?.balance || 0)}</span>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Quantity" 
                    className="w-full"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="default" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => executeTrade('buy')}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Buy'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => executeTrade('sell')}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Sell'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <Tabs defaultValue="positions">
                  <TabsList className="w-full">
                    <TabsTrigger value="positions" className="flex-1">Positions</TabsTrigger>
                    <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                  </TabsList>
                  <TabsContent value="positions">
                    {!hasPositions() ? (
                      <p className="text-center text-muted-foreground py-4">No open positions</p>
                    ) : (
                      <div className="space-y-2">
                        {portfolio.positions.map((position) => (
                          <div key={position.symbol} className="flex justify-between p-2 border rounded">
                            <span>{position.symbol}</span>
                            <span>{position.quantity} shares</span>
                            <span className={position.pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${position.pl?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="orders">
                    <p className="text-center text-muted-foreground py-4">No pending orders</p>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Market Categories */}
            <div className="col-span-12">
              <Card className="p-4">
                <Tabs defaultValue="large-cap">
                  <TabsList>
                    <TabsTrigger value="large-cap">Large Cap</TabsTrigger>
                    <TabsTrigger value="mid-cap">Mid Cap</TabsTrigger>
                    <TabsTrigger value="small-cap">Small Cap</TabsTrigger>
                  </TabsList>
                  {Object.entries(marketData || {}).map(([category, stocks]) => (
                    <TabsContent key={category} value={category}>
                      <div className="grid grid-cols-4 gap-4">
                        {Array.isArray(stocks) && stocks.map((stock) => (
                          <Card key={stock.symbol} className="p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => setSelectedStock(stock.symbol)}>
                            <h4 className="font-bold">{stock.symbol}</h4>
                            <p className="text-sm">{stock.name}</p>
                            <p className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {stock.change?.toFixed(2)}%
                            </p>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="holdings">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Your Holdings</h2>
            {hasPositions() ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.positions.map((position) => (
                  <Card 
                    key={position.symbol} 
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedStock(position.symbol)
                      // Switch to explore tab
                      document.querySelector('[value="explore"]').click()
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold">{position.symbol}</h3>
                      <span className={position.pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {position.pl >= 0 ? '▲' : '▼'} ${Math.abs(position.pl).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{position.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Price:</span>
                        <span>${position.entry_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span>${position.current_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span>${formatCurrency(position.quantity * position.current_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return:</span>
                        <span className={position.pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {((position.pl / (position.entry_price * position.quantity)) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No holdings yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="watchlist">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
            <p className="text-center text-gray-500">Coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
