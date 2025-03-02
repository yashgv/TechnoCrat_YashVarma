const STORAGE_KEYS = {
  PORTFOLIO: 'paper_trading_portfolio',
  WATCHLIST: 'paper_trading_watchlist',
  TRADES: 'paper_trading_trades'
};

// Initial portfolio data
const DEFAULT_HOLDINGS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    entry_price: 170.50,
    current_price: 170.50,
    pl: 0
  }
];

// Initial watchlist data
const DEFAULT_WATCHLIST = ['MSFT', 'GOOGL', 'AMZN', 'AAPL'];

export const storage = {
  initializeStorage: () => {
    // Initialize portfolio if not exists
    if (!localStorage.getItem(STORAGE_KEYS.PORTFOLIO)) {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify({
        balance: 1000000,
        positions: DEFAULT_HOLDINGS
      }));
    }

    // Initialize watchlist if not exists
    if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(DEFAULT_WATCHLIST));
    }
  },

  getPortfolio: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          balance: parsed.balance || 1000000,
          positions: Array.isArray(parsed.positions) ? parsed.positions : DEFAULT_HOLDINGS
        };
      }
      return {
        balance: 1000000,
        positions: DEFAULT_HOLDINGS
      };
    } catch (error) {
      console.error('Error loading portfolio:', error);
      return {
        balance: 1000000,
        positions: DEFAULT_HOLDINGS
      };
    }
  },

  savePortfolio: (portfolio) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
      console.log('Portfolio saved:', portfolio);
    } catch (error) {
      console.error('Error saving portfolio:', error);
    }
  },

  getWatchlist: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch (error) {
      console.error('Error loading watchlist:', error);
      return DEFAULT_WATCHLIST;
    }
  },

  saveWatchlist: (watchlist) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
      console.log('Watchlist saved:', watchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO);
    localStorage.removeItem(STORAGE_KEYS.WATCHLIST);
    localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
  },

  getTrades: () => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  },

  saveTrade: (trade) => {
    const trades = storage.getTrades();
    trades.push({
      ...trade,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },

  updatePosition: (position) => {
    const portfolio = storage.getPortfolio();
    const index = portfolio.positions.findIndex(p => p.symbol === position.symbol);
    
    if (index !== -1) {
      portfolio.positions[index] = position;
    } else {
      portfolio.positions.push(position);
    }
    
    storage.savePortfolio(portfolio);
  }
};
