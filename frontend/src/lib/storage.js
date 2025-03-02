const STORAGE_KEYS = {
  PORTFOLIO: 'paper_trading_portfolio',
  WATCHLIST: 'paper_trading_watchlist',
  TRADES: 'paper_trading_trades'
};

// Sample initial holdings
const DEFAULT_HOLDINGS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    entry_price: 170.50,
    current_price: 170.50,
    pl: 0,
    bought_at: new Date().toISOString()
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    quantity: 50,
    entry_price: 2450.75,
    current_price: 2450.75,
    pl: 0,
    bought_at: new Date().toISOString()
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    quantity: 25,
    entry_price: 3680.50,
    current_price: 3680.50,
    pl: 0
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys',
    quantity: 100,
    entry_price: 1560.25,
    current_price: 1560.25,
    pl: 0
  }
];

export const storage = {
  getPortfolio: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loaded portfolio from storage:', parsed);
        return parsed;
      }
      console.log('No saved portfolio, using default');
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
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
  },

  getWatchlist: () => {
    const saved = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (saved) {
      return JSON.parse(saved);
    }
    return ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS'];
  },

  saveWatchlist: (watchlist) => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
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
