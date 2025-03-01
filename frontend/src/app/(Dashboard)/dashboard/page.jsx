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
  RefreshCw
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
  Area
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Sample data - Replace with real data from your API
const performanceData = [
  { name: 'Jan', value: 1000 },
  { name: 'Feb', value: 1200 },
  { name: 'Mar', value: 1100 },
  { name: 'Apr', value: 1300 },
  { name: 'May', value: 1400 },
  { name: 'Jun', value: 1350 },
];

const recentActivities = [
  { id: 1, type: 'Purchase', stock: 'AAPL', amount: '$500', date: '2024-01-20' },
  { id: 2, type: 'Sale', stock: 'GOOGL', amount: '$750', date: '2024-01-19' },
  { id: 3, type: 'Analysis', stock: 'MSFT', amount: '-', date: '2024-01-18' },
];

const API_URL = 'http://localhost:5000/api/trending-stocks';

export default function DashboardPage() {
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrendingStocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trending stocks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTrendingStocks(data.data);
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      setError(error.message);
      setTrendingStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingStocks();
  }, []);

  const handleRefresh = () => {
    fetchTrendingStocks();
  };

  const MetricCard = ({ title, value, change, icon: Icon }) => {
    const isPositive = change >= 0;
    const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              <ChangeIcon className="h-4 w-4" />
              <span className="text-sm">{Math.abs(change)}%</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{value}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TrendingStocksSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TrendingStocksError = () => (
    <div className="text-center p-6">
      <p className="text-red-500 mb-4">{error || 'Failed to load trending stocks'}</p>
      <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Portfolio Value"
          value="$15,231.89"
          change={2.5}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Gain/Loss"
          value="$831.40"
          change={1.2}
          icon={TrendingUp}
        />
        <MetricCard
          title="Active Positions"
          value="8"
          change={-1}
          icon={Activity}
        />
        <MetricCard
          title="Analyzed Stocks"
          value="24"
          change={4.8}
          icon={BarChart2}
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Portfolio Performance Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.stock} • {activity.date}
                    </p>
                  </div>
                  <div className="font-medium">
                    {activity.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Stocks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trending Stocks</CardTitle>
          <div className="text-sm text-muted-foreground">
            {!isLoading && !error && trendingStocks.length > 0 && 
              "Last updated: " + new Date().toLocaleTimeString()
            }
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TrendingStocksSkeleton />
          ) : error ? (
            <TrendingStocksError />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingStocks.map((stock) => (
                <Card key={stock.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{stock.symbol}</p>
                          <p className="text-sm text-muted-foreground">{stock.name}</p>
                        </div>
                        <div className={`flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stock.change >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">{Math.abs(stock.change)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${stock.price.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">
                          Vol: {(stock.volume / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}