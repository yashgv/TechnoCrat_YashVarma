import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Star, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import StockChart from "@/components/charts/StockChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export function ExploreTab({
  stockDetails,
  candleData,
  timeframe,
  setTimeframe,
  searchQuery,
  searchResults,
  handleSearch,
  onSelectStock,
  onToggleWatchlist,
  watchlist,
  portfolio,
  formatCurrency,
  marketStatus,
  executeTrade
}) {
  const [tradeQuantity, setTradeQuantity] = useState(1);

  const handleTrade = (action) => {
    if (!stockDetails) {
      toast({
        title: "Error",
        description: "Please select a stock first",
        variant: "destructive",
      });
      return;
    }

    // Calculate total cost
    const totalCost = tradeQuantity * stockDetails.price;

    // Validate trade
    if (action === 'buy') {
      if (totalCost > portfolio.balance) {
        toast({
          title: "Insufficient Funds",
          description: `You need ₹${formatCurrency(totalCost)} to buy ${tradeQuantity} shares`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Check for sell action
      const position = portfolio.positions.find(p => p.symbol === stockDetails.symbol);
      if (!position || position.quantity < tradeQuantity) {
        toast({
          title: "Insufficient Shares",
          description: `You don't have enough shares to sell`,
          variant: "destructive",
        });
        return;
      }
    }

    executeTrade(action, tradeQuantity, stockDetails.symbol);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Left Panel - Search and Trading */}
      <div className="xl:col-span-1 space-y-4">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                {searchResults.map(result => (
                  <div 
                    key={result.symbol}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                    onClick={() => onSelectStock(result.symbol)}
                  >
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{result.symbol}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(result.symbol);
                      }}
                    >
                      <Star className={`h-4 w-4 ${
                        watchlist.includes(result.symbol) ? 'fill-yellow-400 text-yellow-400' : ''
                      }`} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Card */}
        {stockDetails && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Trade {stockDetails.name}</CardTitle>
                <Badge className={marketStatus.isOpen ? 'bg-green-600' : 'bg-red-600'}>
                  {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="font-medium">₹{formatCurrency(stockDetails.price)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <span className="font-medium">₹{formatCurrency(portfolio.balance)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    Total: ₹{formatCurrency(tradeQuantity * stockDetails.price)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleTrade('buy')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!marketStatus.isOpen}
                  >
                    Buy {tradeQuantity} shares
                  </Button>
                  <Button
                    onClick={() => handleTrade('sell')}
                    variant="destructive"
                    disabled={!marketStatus.isOpen}
                  >
                    Sell {tradeQuantity} shares
                  </Button>
                </div>

                {!marketStatus.isOpen && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Market opens at {marketStatus.nextOpenTime}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart and Details Panel */}
      <div className="xl:col-span-3 space-y-6">
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
              <StockChart data={candleData} height={500} />
            </div>
          </CardContent>
        </Card>

        {stockDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">P/E Ratio</p>
                  <p className="font-medium">{stockDetails.details.pe_ratio.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">52W High</p>
                  <p className="font-medium">₹{formatCurrency(stockDetails.details.week52_high)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">52W Low</p>
                  <p className="font-medium">₹{formatCurrency(stockDetails.details.week52_low)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-medium">{stockDetails.volume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
