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
import StockChart from '@/components/charts/StockChart';
import { storage } from '@/lib/storage';
import StockRecommendations from '@/components/StockRecommendations';
import { TabContent } from '@/components/dashboard/TabContent';

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
  // Add activeTab state
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Initialize data from localStorage
  useEffect(() => {
    try {
      // Initialize storage with defaults if needed
      storage.initializeStorage();

      // Load portfolio
      const savedPortfolio = storage.getPortfolio();
      console.log('Loading portfolio:', savedPortfolio);
      setPortfolio(savedPortfolio);

      // Load watchlist
      const savedWatchlist = storage.getWatchlist();
      console.log('Loading watchlist:', savedWatchlist);
      setWatchlist(savedWatchlist);

      // Start market status checker
      const statusInterval = setInterval(checkMarketStatus, 60000);
      checkMarketStatus();

      // Initial data fetch
      setLoading(false);
      fetchAllData();

      return () => clearInterval(statusInterval);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load saved data",
        variant: "destructive",
      });
    }
  }, []);

  // Save portfolio changes to localStorage
  useEffect(() => {
    if (portfolio) {
      storage.savePortfolio(portfolio);
    }
  }, [portfolio]);

  // Save watchlist changes to localStorage
  useEffect(() => {
    if (watchlist) {
      storage.saveWatchlist(watchlist);
    }
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

  // Modified executeTrade function
  const executeTrade = async (action, quantity, symbol) => {
    try {
      const stockToTrade = stockDetails || stocksData.flat().find(s => s.symbol === symbol);
      
      if (!stockToTrade) {
        toast({
          title: "Error",
          description: "Stock details not available",
          variant: "destructive",
        });
        return;
      }

      // Simulate trade execution
      const tradePrice = stockToTrade.price;
      const totalCost = tradePrice * quantity;

      if (action === 'buy') {
        if (totalCost > portfolio.balance) {
          toast({
            title: "Insufficient Funds",
            description: "Not enough balance to execute trade",
            variant: "destructive",
          });
          return;
        }

        setPortfolio(prev => {
          const existingPosition = prev.positions.find(p => p.symbol === symbol);
          const newPositions = existingPosition
            ? prev.positions.map(p => 
                p.symbol === symbol 
                  ? {
                      ...p,
                      quantity: p.quantity + quantity,
                      entry_price: (p.entry_price * p.quantity + tradePrice * quantity) / (p.quantity + quantity)
                    }
                  : p
              )
            : [
                ...prev.positions,
                {
                  symbol,
                  name: stockToTrade.name,
                  quantity,
                  entry_price: tradePrice,
                  current_price: tradePrice,
                  pl: 0
                }
              ];

          return {
            ...prev,
            balance: prev.balance - totalCost,
            positions: newPositions
          };
        });

      } else if (action === 'sell') {
        const position = portfolio.positions.find(p => p.symbol === symbol);
        if (!position || position.quantity < quantity) {
          toast({
            title: "Error",
            description: "Not enough shares to sell",
            variant: "destructive",
          });
          return;
        }

        setPortfolio(prev => ({
          ...prev,
          balance: prev.balance + totalCost,
          positions: prev.positions
            .map(p => 
              p.symbol === symbol
                ? {
                    ...p,
                    quantity: p.quantity - quantity,
                    pl: p.pl + (tradePrice - p.entry_price) * quantity
                  }
                : p
            )
            .filter(p => p.quantity > 0)
        }));
      }

      // Save to localStorage
      storage.saveTrade({
        symbol,
        action,
        quantity,
        price: tradePrice,
        total: totalCost,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Trade Executed",
        description: `Successfully ${action}ed ${quantity} shares of ${stockToTrade.name}`,
      });

    } catch (error) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
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
          <p className="text-muted-foreground mt-2">Connecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={marketStatus.isOpen ? "success" : "destructive"}
              className={`py-1 ${marketStatus.isOpen ? 'bg-green-600' : 'bg-red-600'}`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
            </Badge>
            {!marketStatus.isOpen && (
              <span className="text-sm text-muted-foreground">
                Next open: {marketStatus.nextOpenTime}
              </span>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketIndices.map(index => (
          <Card key={index.name} className="bg-gradient-to-br from-gray-50 to-gray-100">
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

      {/* Tab Content */}
      <TabContent
        activeTab={activeTab}
        portfolio={portfolio}
        stockDetails={stockDetails}
        watchlist={watchlist}
        stocksData={stocksData}
        candleData={candleData}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onSelectStock={setSelectedStock}
        onToggleWatchlist={toggleWatchlist}
        onExecuteTrade={executeTrade}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatPercentage={formatPercentage}
        marketStatus={marketStatus}
        searchQuery={searchQuery}
        searchResults={searchResults}
        handleSearch={handleSearch}
        quantity={quantity}
        setQuantity={setQuantity}
      />
    </div>
  );
}

