'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area
} from 'recharts';

const StockChart = ({ data, width = "100%", height = 400 }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calculate moving averages
    const ma20Period = 20;
    const ma50Period = 50;

    return data.map((item, index) => {
      const ma20 = index >= ma20Period - 1 
        ? data.slice(index - ma20Period + 1, index + 1).reduce((sum, d) => sum + d.close, 0) / ma20Period 
        : null;
      
      const ma50 = index >= ma50Period - 1
        ? data.slice(index - ma50Period + 1, index + 1).reduce((sum, d) => sum + d.close, 0) / ma50Period
        : null;

      return {
        ...item,
        MA20: ma20,
        MA50: ma50
      };
    });
  }, [data]);

  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 100];
    const prices = data.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width={width} height={height}>
      <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 50, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="date"
          tickFormatter={date => new Date(date).toLocaleDateString()}
        />
        <YAxis 
          domain={yDomain}
          tickFormatter={value => `₹${value.toFixed(2)}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-white p-3 border rounded-lg shadow-lg">
                <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="text-right">₹{data.open.toFixed(2)}</span>
                  <span className="text-muted-foreground">High:</span>
                  <span className="text-right">₹{data.high.toFixed(2)}</span>
                  <span className="text-muted-foreground">Low:</span>
                  <span className="text-right">₹{data.low.toFixed(2)}</span>
                  <span className="text-muted-foreground">Close:</span>
                  <span className="text-right">₹{data.close.toFixed(2)}</span>
                  {data.MA20 && (
                    <>
                      <span className="text-muted-foreground">MA20:</span>
                      <span className="text-right text-blue-600">₹{data.MA20.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />

        {/* Price Area */}
        <Area
          type="monotone"
          dataKey="close"
          stroke="#2563eb"
          fill="url(#colorGradient)"
          strokeWidth={2}
        />

        {/* Moving averages */}
        <Line 
          type="monotone"
          dataKey="MA20"
          stroke="#7c3aed"
          dot={false}
          strokeWidth={1}
        />
        <Line 
          type="monotone"
          dataKey="MA50"
          stroke="#ef4444"
          dot={false}
          strokeWidth={1}
        />

        {/* Gradient for area */}
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default StockChart;
