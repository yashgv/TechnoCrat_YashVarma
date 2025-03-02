import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";
import { storage } from '@/lib/storage';

export function HoldingsTab({ formatCurrency, onSelectStock }) {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    // Load portfolio data from storage
    const savedPortfolio = storage.getPortfolio();
    setPortfolio(savedPortfolio);
  }, []);

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Loading Holdings...</h3>
      </div>
    );
  }

  const totalInvestment = portfolio.positions.reduce((sum, pos) => sum + (pos.entry_price * pos.quantity), 0);
  const currentValue = portfolio.positions.reduce((sum, pos) => sum + (pos.current_price * pos.quantity), 0);
  const totalPL = currentValue - totalInvestment;
  const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="text-xl font-bold">₹{formatCurrency(totalInvestment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-xl font-bold">₹{formatCurrency(currentValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-xl font-bold flex items-center ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPL >= 0 ? <ArrowUpRight className="h-5 w-5 mr-1" /> : <ArrowDownRight className="h-5 w-5 mr-1" />}
                ₹{formatCurrency(Math.abs(totalPL))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L %</p>
              <p className={`text-xl font-bold ${plPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Holdings
            <span className="text-sm text-muted-foreground">
              {portfolio.positions.length} Positions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.positions.length > 0 ? (
            <div className="space-y-4">
              {portfolio.positions.map(position => (
                <Card
                  key={position.symbol}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectStock(position.symbol)}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-medium">{position.name}</h4>
                        <p className="text-sm text-muted-foreground">{position.symbol}</p>
                      </div>
                      <div className="text-right md:text-left">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{position.quantity}</p>
                      </div>
                      <div className="text-right md:text-left">
                        <p className="text-sm text-muted-foreground">Avg. Price</p>
                        <p className="font-medium">₹{formatCurrency(position.entry_price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="font-medium">₹{formatCurrency(position.current_price * position.quantity)}</p>
                        <p className={`text-sm ${position.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pl >= 0 ? '+' : ''}₹{formatCurrency(position.pl)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Holdings Yet</h3>
              <p className="text-sm text-muted-foreground">Start trading to build your portfolio</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
