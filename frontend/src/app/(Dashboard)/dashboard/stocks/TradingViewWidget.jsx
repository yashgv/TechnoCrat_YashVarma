'use client'

import { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ symbol = 'AAPL', market = 'NSE' }) {
  const container = useRef()

  useEffect(() => {
    if (!symbol) return;

    const getSymbolWithExchange = () => {
      // Support for various exchanges
      switch (market) {
        case 'NSE':
          return `NSE:${symbol.split('.')[0]}`
        case 'BSE':
          return `BSE:${symbol.split('.')[0]}`
        case 'NYSE':
          return `NYSE:${symbol}`
        case 'NASDAQ':
          return `NASDAQ:${symbol}`
        default:
          return symbol
      }
    }

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true

    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": getSymbolWithExchange(),
          "interval": "D",
          "timezone": "Asia/Kolkata",
          "theme": "light",
          "style": "1",
          "locale": "in",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": container.current.id,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": true,
          "studies": [
            "Volume@tv-basicstudies",
            "VWAP@tv-basicstudies"
          ],
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
        });
      }
    };

    container.current.innerHTML = '';
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    }
  }, [symbol, market])

  return (
    <div 
      id={`tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '')}`}
      ref={container} 
      className="tradingview-widget-container" 
      style={{ height: "100%", width: "100%" }}
    />
  )
}

export default memo(TradingViewWidget)
