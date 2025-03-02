'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ReferenceLine,
} from 'recharts';

const CustomBar = ({ x, y, width, height, fill, bullish }) => {
  const color = bullish ? '#22c55e' : '#ef4444';
  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        x2={x + width / 2}
        y1={y}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Candle body */}
      <rect
        x={x}
        y={bullish ? y + height / 2 : y}
        width={width}
        height={Math.abs(height / 2)}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

const CandlestickChart = ({ data, width = "100%", height = 400 }) => {
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
        bullish: item.close >= item.open,
        bodyHeight: Math.abs(item.close - item.open),
        wickHeight: Math.abs(item.high - item.low),
        MA20: ma20,
        MA50: ma50,
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

  const volumeMax = useMemo(() => {
    if (!data || data.length === 0) return 1000000;
    return Math.max(...data.map(d => d.volume));
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
          yAxisId="price"
          domain={yDomain}
          orientation="right"
          tickFormatter={value => `₹${value.toFixed(2)}`}
        />
        <YAxis 
          yAxisId="volume"
          orientation="left"
          tickFormatter={value => `${(value/1000000).toFixed(1)}M`}
          domain={[0, volumeMax]}
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
                  <span className={`text-right ${data.bullish ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{data.open.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">High:</span>
                  <span className="text-right text-green-600">₹{data.high.toFixed(2)}</span>
                  <span className="text-muted-foreground">Low:</span>
                  <span className="text-right text-red-600">₹{data.low.toFixed(2)}</span>
                  <span className="text-muted-foreground">Close:</span>
                  <span className={`text-right ${data.bullish ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{data.close.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="text-right">{data.volume.toLocaleString()}</span>
                  {data.MA20 && (
                    <>
                      <span className="text-muted-foreground">MA20:</span>
                      <span className="text-right text-blue-600">₹{data.MA20.toFixed(2)}</span>
                    </>
                  )}
                  {data.MA50 && (
                    <>
                      <span className="text-muted-foreground">MA50:</span>
                      <span className="text-right text-purple-600">₹{data.MA50.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />

        {/* Volume bars */}
        <Bar
          dataKey="volume"
          yAxisId="volume"
          fill="#6b7280"
          opacity={0.3}
          barSize={6}
        />

        {/* Candlesticks */}
        <Bar
          dataKey="bodyHeight"
          yAxisId="price"
          barSize={8}
          shape={<CustomBar />}
        />

        {/* Moving averages */}
        <Line 
          type="monotone"
          dataKey="MA20"
          stroke="#2563eb"
          dot={false}
          strokeWidth={1}
          yAxisId="price"
        />
        <Line 
          type="monotone"
          dataKey="MA50"
          stroke="#7c3aed"
          dot={false}
          strokeWidth={1}
          yAxisId="price"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CandlestickChart;
