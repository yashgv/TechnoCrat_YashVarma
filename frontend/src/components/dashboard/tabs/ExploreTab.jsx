import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import TradingViewWidget from '@/app/(Dashboard)/dashboard/stocks/TradingViewWidget';
import { Label } from "@/components/ui/label";
export function ExploreTab({
  stockDetails,
  onSelectStock,
  portfolio,
  formatCurrency,
  marketStatus,
  executeTrade
}) {
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const defaultSymbol = 'AAPL';

  const handleTrade = (action) => {
    const currentStock = stockDetails || { symbol: defaultSymbol, price: 0 };
    const totalCost = tradeQuantity * currentStock.price;

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
      const position = portfolio.positions.find(p => p.symbol === currentStock.symbol);
      if (!position || position.quantity < tradeQuantity) {
        toast({
          title: "Insufficient Shares",
          description: `You don't have enough shares to sell`,
          variant: "destructive",
        });
        return;
      }
    }

    executeTrade(action, tradeQuantity, currentStock.symbol);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[800px]">
      {/* TradingView Chart */}
      <div className="col-span-9 relative">
        <Card className="h-full">
          <CardContent className="p-0">
            <TradingViewWidget 
              symbol={stockDetails?.symbol || defaultSymbol} 
              market={{ id: 'US' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Fixed Trading Panel */}
      <div className="col-span-3 h-full">
        <Card className="sticky top-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Badge className={marketStatus.isOpen ? 'bg-green-600' : 'bg-red-600'}>
                {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
              </Badge>
              <span className="text-sm font-medium">
                Balance: ₹{formatCurrency(portfolio.balance)}
              </span>
            </div>

            {stockDetails && (
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">{stockDetails.name}</h3>
                  <span className="text-sm text-muted-foreground">{stockDetails.symbol}</span>
                </div>
                <div className="text-2xl font-bold text-center py-2">
                  ₹{formatCurrency(stockDetails.price)}
                </div>
              </div>
            )}

            {!marketStatus.isOpen && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Opens at {marketStatus.nextOpenTime}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24"
                  />
                  <span className="text-sm flex-1 text-right">
                    Total: ₹{formatCurrency((stockDetails?.price || 0) * tradeQuantity)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleTrade('buy')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!marketStatus.isOpen}
                >
                  Buy
                </Button>
                <Button
                  onClick={() => handleTrade('sell')}
                  variant="destructive"
                  disabled={!marketStatus.isOpen}
                >
                  Sell
                </Button>
              </div>
            </div>

            {stockDetails && portfolio.positions.find(p => p.symbol === stockDetails.symbol) && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium text-sm">Your Position</h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Shares Owned:</span>
                  <span className="text-right font-medium">
                    {portfolio.positions.find(p => p.symbol === stockDetails.symbol)?.quantity || 0}
                  </span>
                  <span className="text-muted-foreground">Avg. Price:</span>
                  <span className="text-right font-medium">
                    ₹{formatCurrency(portfolio.positions.find(p => p.symbol === stockDetails.symbol)?.entry_price || 0)}
                  </span>
                  <span className="text-muted-foreground">Market Value:</span>
                  <span className="text-right font-medium">
                    ₹{formatCurrency((portfolio.positions.find(p => p.symbol === stockDetails.symbol)?.quantity || 0) * (stockDetails.price || 0))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
