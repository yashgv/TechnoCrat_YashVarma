import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ArrowUpRight, ArrowDownRight, Eye, Info, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function WatchlistTab({ 
  watchlist, 
  stocksData, 
  formatCurrency, 
  formatPercentage, 
  onSelectStock, 
  onToggleWatchlist 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // All available stocks (flatten stocksData)
  const allStocks = Object.values(stocksData)
    .flat()
    .filter(stock => stock && stock.symbol);

  // Filter stocks based on search query
  const searchResults = searchQuery
    ? allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get watchlist stocks with data
  const watchlistStocks = watchlist
    .map(symbol => allStocks.find(s => s.symbol === symbol))
    .filter(stock => stock); // Remove undefined entries

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Watchlist Panel */}
      <Card className="h-[800px] flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Watchlist ({watchlistStocks.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {watchlistStocks.length > 0 ? (
                watchlistStocks.map(stock => (
                  <Card
                    key={stock.symbol}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectStock(stock.symbol)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{stock.name}</h4>
                          <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-medium">₹{formatCurrency(stock.price)}</p>
                            <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(stock.change)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(stock.symbol);
                            }}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your Watchlist is Empty</h3>
                  <p className="text-sm text-muted-foreground">
                    Search and add stocks to track their performance
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Search and Add Panel */}
      <Card className="h-[800px] flex flex-col">
        <CardHeader>
          <CardTitle>Add to Watchlist</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {searchResults.map(stock => (
                <Card
                  key={stock.symbol}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{stock.name}</h4>
                        <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(stock.symbol);
                        }}
                      >
                        {watchlist.includes(stock.symbol) ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No stocks found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
