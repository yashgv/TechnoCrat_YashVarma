'use client'

import { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ symbol, market }) {
  const container = useRef()

  useEffect(() => {
    if (!symbol) return;

    const getSymbolWithExchange = () => {
      switch (market?.id) {
        case 'IN':
          return `NSE:${symbol}`
        case 'UK':
          return `LSE:${symbol}`
        case 'JP':
          return `JPX:${symbol}`
        default:
          return `NASDAQ:${symbol}`
      }
    }

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true

    script.innerHTML = `
      {
        "width": "100%",
        "height": "600",
        "symbol": "${getSymbolWithExchange()}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "support_host": "https://www.tradingview.com"
      }`

    if (container.current) {
      container.current.innerHTML = ''
      container.current.appendChild(script)
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [symbol, market])

  if (!symbol) return null;

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export default memo(TradingViewWidget)
