'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function StockRecommendations({ onSelectStock, className }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5002/api/stock-recommendations');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Handle the array response directly
      setRecommendations(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(error.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'BUY': return 'bg-green-100 text-green-800';
      case 'SELL': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getScoreColor = (score) => {
    if (score > 1) return 'text-green-600';
    if (score < 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Loading AI Recommendations...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRecommendations}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <CardHeader className="border-b sticky top-0 bg-white z-10">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRecommendations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            {recommendations.map((stock) => (
              <Card
                key={stock.symbol}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectStock(stock.symbol)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium truncate">{stock.name}</h3>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                    <Badge className={getActionColor(stock.recommendation?.action)}>
                      {stock.recommendation?.action}
                    </Badge>
                  </div>

                  {/* Price Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">₹{stock.current_price?.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-medium">₹{stock.recommendation?.target_price?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`flex items-center justify-center p-1 rounded ${getScoreColor(stock.confidence_metrics?.technical_score)}`}>
                      Score: {stock.confidence_metrics?.technical_score?.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center p-1 rounded bg-gray-100">
                      {stock.sentiment?.status}
                    </div>
                    <div className="flex items-center justify-center p-1 rounded bg-gray-100">
                      Risk: {Math.abs(stock.confidence_metrics?.risk_score * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Insights Preview */}
                  {/* {stock.insights && (
                    <div className="text-xs text-muted-foreground mt-3 pt-3 border-t line-clamp-2">
                      {stock.insights}
                    </div>
                  )} */}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
}
