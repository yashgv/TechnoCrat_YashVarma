import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, TrendingUp, Briefcase } from "lucide-react";
import StockRecommendations from "@/components/StockRecommendations";

export function OverviewTab({ portfolio, formatCurrency, onSelectStock }) {
  // Add null check for portfolio
  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  const totalValue = portfolio.balance + 
    (portfolio.positions?.reduce((sum, pos) => sum + pos.quantity * pos.current_price, 0) || 0);
  const totalPL = portfolio.positions?.reduce((sum, pos) => sum + pos.pl, 0) || 0;
  
  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium">Portfolio Value</h3>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">₹{formatCurrency(totalValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium">Cash Balance</h3>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">₹{formatCurrency(portfolio.balance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-medium">Total P&L</h3>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{formatCurrency(totalPL)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-medium">Active Positions</h3>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{portfolio.positions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Current Holdings */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Current Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.positions.length > 0 ? (
              <div className="space-y-4">
                {portfolio.positions.map(position => (
                  <div 
                    key={position.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    onClick={() => onSelectStock(position.symbol)}
                  >
                    <div>
                      <h4 className="font-medium">{position.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {position.quantity} shares @ ₹{formatCurrency(position.entry_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{formatCurrency(position.current_price * position.quantity)}</p>
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
                <h3 className="font-medium">No Active Positions</h3>
                <p className="text-sm text-muted-foreground">Start trading to build your portfolio</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="xl:col-span-1">
          <StockRecommendations onSelectStock={onSelectStock} className="h-full" />
        </Card>
      </div>
    </div>
  );
}
