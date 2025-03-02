import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ArrowUpRight, ArrowDownRight, Eye, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WatchlistTab({ 
  watchlist, 
  stocksData, 
  formatCurrency, 
  formatPercentage, 
  onSelectStock, 
  onToggleWatchlist 
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Watchlist
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click on a stock to view details and trade</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {watchlist.length} stocks
            </span>
          </div>
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
                  <Card
                    key={symbol}
                    className="hover:bg-gray-50 cursor-pointer transition-all"
                    onClick={() => onSelectStock(symbol)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(symbol);
                            }}
                          >
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </Button>
                          <div>
                            <h4 className="font-medium">{stockData.name}</h4>
                            <p className="text-sm text-muted-foreground">{symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{formatCurrency(stockData.price)}</p>
                          <p className={`text-sm flex items-center justify-end ${
                            stockData.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stockData.change >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                            )}
                            {formatPercentage(stockData.change)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Your Watchlist is Empty</h3>
              <p className="text-sm text-muted-foreground">
                Add stocks to track their performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
