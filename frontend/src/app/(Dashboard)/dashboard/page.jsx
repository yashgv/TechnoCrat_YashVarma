'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  DollarSign, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  RefreshCw,
  Clock,
  Star,
  StarOff,
  Eye,
  Briefcase,
  Sliders,
  Search
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import TradingViewWidget from './stocks/TradingViewWidget';
import CandlestickChart from '@/components/charts/CandlestickChart';
import StockRecommendations from '@/components/StockRecommendations';

// Sample data - Will be replaced with API data
const generateCandleData = (count = 30) => {
  const data = [];
  let basePrice = 1500;
  
  for (let i = 0; i < count; i++) {
    const volatility = Math.random() * 50;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    let close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;
    
    data.push({
      date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000)
    });
    
    basePrice = close;
  }
  
  return data;
};

// Sample indices data for Indian market
const marketIndices = [
  { name: 'NIFTY 50', value: 22541.34, change: 0.67 },
  { name: 'SENSEX', value: 74019.96, change: 0.72 },
  { name: 'NIFTY BANK', value: 48268.75, change: 0.81 },
  { name: 'NIFTY IT', value: 37912.45, change: -0.32 }
];

export default function DashboardPage() {
  // State management
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState({ 
    balance: 1000000, // 10 lakhs initial balance
    positions: [] 
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stocksData, setStocksData] = useState({});
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, nextOpenTime: '09:15 AM IST' });
  const [stockDetails, setStockDetails] = useState(null);
  const [candleData, setCandleData] = useState(generateCandleData());
  const [timeframe, setTimeframe] = useState('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Sample categories for Indian market
  const categories = {
    'large-cap': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS'],
    'mid-cap': ['BAJFINANCE.NS', 'ADANIPORTS.NS', 'AXISBANK.NS', 'TATAMOTORS.NS'],
    'small-cap': ['IRCTC.NS', 'JINDALSTEL.NS', 'PGHH.NS', 'GODREJCP.NS']
  };
  
  // Market hours for Indian market (IST)
  const marketHours = {
    open: '09:15',
    close: '15:30',
    days: [1, 2, 3, 4, 5] // Monday to Friday
  };

  // Initialize from localStorage
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
    
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    } else {
      // Default watchlist
      setWatchlist(['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS']);
    }
    
    // Simulate API loading
    setTimeout(() => {
      setLoading(false);
      fetchAllData();
    }, 1500);
    
    // Start market status checker
    const statusInterval = setInterval(checkMarketStatus, 60000);
    checkMarketStatus();
    
    return () => clearInterval(statusInterval);
  }, []);

  // Save to localStorage when portfolio or watchlist changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);
  
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  
  // Fetch stock details when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchStockDetails(selectedStock);
      // Generate new candle data when stock changes
      setCandleData(generateCandleData());
    }
  }, [selectedStock, timeframe]);

  // Check if Indian market is open
  const checkMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Check if it's a weekday and within market hours
    const isWeekday = marketHours.days.includes(day);
    const isWithinHours = currentTime >= marketHours.open && currentTime <= marketHours.close;
    
    const isOpen = isWeekday && isWithinHours;
    
    // Calculate next opening time
    let nextOpenDate = new Date();
    if (!isWeekday || currentTime > marketHours.close) {
      // Move to next trading day
      let daysToAdd = 1;
      if (day === 5) daysToAdd = 3; // Friday to Monday
      if (day === 6) daysToAdd = 2; // Saturday to Monday
      nextOpenDate.setDate(nextOpenDate.getDate() + daysToAdd);
    }
    
    // Set time to opening hour
    nextOpenDate.setHours(parseInt(marketHours.open.split(':')[0], 10));
    nextOpenDate.setMinutes(parseInt(marketHours.open.split(':')[1], 10));
    
    setMarketStatus({
      isOpen,
      nextOpenTime: nextOpenDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      })
    });
  };

  // Simulation of API calls
  const fetchAllData = () => {
    // Generate data for each category
    const data = {};
    
    Object.entries(categories).forEach(([category, symbols]) => {
      data[category] = symbols.map(symbol => {
        const stockName = symbol.split('.')[0];
        return {
          symbol,
          name: stockName,
          price: Math.floor(Math.random() * 5000) + 100,
          change: (Math.random() * 6) - 3, // between -3% and +3%
          volume: Math.floor(Math.random() * 1000000)
        };
      });
    });
    
    setStocksData(data);
  };

  const fetchStockDetails = async (symbol) => {
    try {
      setLoading(true);
      // Fetch stock details
      const response = await fetch(`/api/stock/${symbol}`);
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
  
      // Transform historical data for candlestick chart
      const historicalData = data.historical.map(item => ({
        date: new Date(item.date).toISOString(),
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
        volume: item.Volume
      }));
  
      setCandleData(historicalData);
      setStockDetails({
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        volume: data.volume,
        marketCap: data.marketCap,
        details: data.details
      });
  
    } catch (error) {
      console.error('Error fetching stock details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Trading functions
  const executeTrade = async (action) => {
    if (!stockDetails) {
      toast({
        title: "Error",
        description: "Stock details not available",
        variant: "destructive",
      });
      return;
    }
    
    // Check if market is open
    if (!marketStatus.isOpen) {
      toast({
        title: "Market Closed",
        description: `Indian market is currently closed. Next open: ${marketStatus.nextOpenTime}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user', // Replace with actual user ID in production
          symbol: stockDetails.symbol,
          quantity: quantity,
          action: action
        }),
      });
  
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Trade Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
  
      // Update portfolio with new data
      setPortfolio(prev => ({
        ...prev,
        balance: data.balance,
        positions: data.positions
      }));
  
      toast({
        title: "Trade Executed",
        description: `Successfully ${action}ed ${quantity} shares of ${stockDetails.name}`,
      });
  
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({
        title: "Error",
        description: "Failed to execute trade",
        variant: "destructive",
      });
    }
  };

  // Watch list functions
  const toggleWatchlist = (symbol) => {
    if (watchlist.includes(symbol)) {
      setWatchlist(prev => prev.filter(item => item !== symbol));
      toast({
        title: "Removed from Watchlist",
        description: `${symbol.split('.')[0]} has been removed from your watchlist`,
      });
    } else {
      setWatchlist(prev => [...prev, symbol]);
      toast({
        title: "Added to Watchlist",
        description: `${symbol.split('.')[0]} has been added to your watchlist`,
      });
    }
  };

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    // Simulate search results
    const allStocks = Object.values(categories).flat();
    const results = allStocks.filter(symbol => 
      symbol.toLowerCase().includes(query.toLowerCase())
    ).map(symbol => ({
      symbol,
      name: symbol.split('.')[0]
    }));
    
    setSearchResults(results);
  };

  // Helper functions
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '0.00';
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('en-IN');
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Update portfolio prices - simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!marketStatus.isOpen) return;
      
      setPortfolio(prev => {
        if (!prev.positions.length) return prev;
        
        const newPositions = prev.positions.map(position => {
          // Simulate price change
          const priceChange = position.current_price * (Math.random() * 0.01 - 0.005); // -0.5% to +0.5%
          const newPrice = position.current_price + priceChange;
          
          return {
            ...position,
            current_price: newPrice,
            pl: (newPrice - position.entry_price) * position.quantity
          };
        });
        
        return {
          ...prev,
          positions: newPositions
        };
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [marketStatus.isOpen]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
          <p className="text-muted-foreground mt-2">Connecting to Indian market...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Market Status */}
        <div className="md:col-span-2">
          <h2 className="text-3xl font-bold">Indian Market Dashboard</h2>
          <p className="text-muted-foreground mb-4">Paper Trading Simulator</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketIndices.map(index => (
              <Card key={index.name}>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">{index.name}</span>
                    <span className="text-xl font-bold">{index.value.toLocaleString('en-IN')}</span>
                    <span className={`text-sm ${index.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                      {index.change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {formatPercentage(index.change)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Market Status Card */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Market Status</h3>
              <Badge 
                variant={marketStatus.isOpen ? "success" : "destructive"}
                className={`py-1 px-3 ${marketStatus.isOpen ? 'bg-green-600' : 'bg-red-600'}`}
              >
                <Clock className="h-4 w-4 mr-1" />
                {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
              </Badge>
            </div>
            {!marketStatus.isOpen && (
              <div className="text-sm text-muted-foreground">
                <p>Next Trading Session:</p>
                <p className="font-medium mt-1">{marketStatus.nextOpenTime}</p>
              </div>
            )}
            <Button 
              onClick={fetchAllData} 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Market Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel - Portfolio Summary */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Portfolio Cards */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      ₹{formatCurrency(portfolio.balance + portfolio.positions.reduce((sum, pos) => sum + pos.quantity * pos.current_price, 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Cash Available</h3>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">₹{formatCurrency(portfolio.balance)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Total P&L</h3>
                  </div>
                  <div className="mt-2">
                    <span className={`text-2xl font-bold ${
                      portfolio.positions.reduce((sum, pos) => sum + pos.pl, 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ₹{formatCurrency(portfolio.positions.reduce((sum, pos) => sum + pos.pl, 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Positions</h3>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{portfolio.positions.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Trade */}
            <div className="mt-6">
              <h4 className="font-medium mb-2">Quick Trade</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {/* Search Results Dropdown */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                  {searchResults.map(result => (
                    <div 
                      key={result.symbol}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setSelectedStock(result.symbol);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-xs text-muted-foreground">{result.symbol}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(result.symbol);
                        }}
                      >
                        {watchlist.includes(result.symbol) ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Center Panel - Chart and Trading */}
        <div className="xl:col-span-2 space-y-6">
          {/* Chart Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {stockDetails ? `${stockDetails.name} (${stockDetails.symbol})` : 'Select a Stock'}
              </CardTitle>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <CandlestickChart data={candleData} height={500} />
              </div>
            </CardContent>
          </Card>

          {/* Trading Panel */}
          {stockDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Trading Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{stockDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">{stockDetails.symbol}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleWatchlist(stockDetails.symbol)}
                  >
                    {watchlist.includes(stockDetails.symbol) ? (
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Star className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">₹{formatCurrency(stockDetails.price)}</span>
                    <span className={`${stockDetails.change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                      {stockDetails.change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {formatPercentage(stockDetails.change)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>P/E Ratio</div>
                    <div className="text-right">{stockDetails.details.pe_ratio.toFixed(2)}</div>
                    
                    <div>52W High</div>
                    <div className="text-right">₹{formatCurrency(stockDetails.details.week52_high)}</div>
                    
                    <div>52W Low</div>
                    <div className="text-right">₹{formatCurrency(stockDetails.details.week52_low)}</div>
                    
                    <div>Volume</div>
                    <div className="text-right">{formatNumber(stockDetails.volume)}</div>
                    
                    <div>Market Cap</div>
                    <div className="text-right">
                      ₹{(stockDetails.marketCap / 10000000).toFixed(2)} Cr
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Trading Balance:</span>
                    <span className="font-bold">₹{formatCurrency(portfolio.balance)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      placeholder="Quantity" 
                      className="w-full"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                    />
                    
                    <div className="text-sm text-right">
                      = ₹{formatCurrency(quantity * (stockDetails?.price || 0))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="default" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => executeTrade('buy')}
                    >
                      Buy
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => executeTrade('sell')}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Recommendations */}
        <Card className="xl:col-span-1 h-full">
          <StockRecommendations 
            onSelectStock={setSelectedStock}
            className="h-full"
          />
        </Card>
      </div>

      {/* Bottom Panel - Holdings & Watchlist */}
      <Tabs defaultValue="holdings" className="mt-6">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="market">Market Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolio.positions.length > 0 ? (
                <div className="space-y-4">
                  {portfolio.positions.map(position => (
                    <div 
                      key={position.symbol}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      onClick={() => setSelectedStock(position.symbol)}
                    >
                      <div>
                        <h4 className="font-medium">{position.name}</h4>
                        <p className="text-sm text-muted-foreground">{position.symbol}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p>₹{formatCurrency(position.current_price)} × {position.quantity}</p>
                        <p className={position.pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {position.pl >= 0 ? '+' : ''}₹{formatCurrency(position.pl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No Holdings</h3>
                  <p className="text-sm text-muted-foreground">Start trading to build your portfolio</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              {watchlist.length > 0 ? (
                <div className="space-y-4">
                  {watchlist.map(symbol => {
                    const stockData = Object.values(stocksData)
                      .flat()
                      .find(s => s.symbol === symbol);
                    
                    if (!stockData) return null;
                    
                    return (
                      <div 
                        key={symbol}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        onClick={() => setSelectedStock(symbol)}
                      >
                        <div className="flex items-center space-x-4">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <div>
                            <h4 className="font-medium">{stockData.name}</h4>
                            <p className="text-sm text-muted-foreground">{symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{formatCurrency(stockData.price)}</p>
                          <p className={`text-sm ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(stockData.change)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">Empty Watchlist</h3>
                  <p className="text-sm text-muted-foreground">Add stocks to track their performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Market Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(stocksData).map(([category, stocks]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="font-medium capitalize mb-2">{category}</h4>
                  <div className="space-y-2">
                    {stocks.map(stock => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedStock(stock.symbol)}
                      >
                        <div className="flex items-center space-x-3">
                          <BarChart2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{stock.name}</p>
                            <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{formatCurrency(stock.price)}</p>
                          <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(stock.change)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

