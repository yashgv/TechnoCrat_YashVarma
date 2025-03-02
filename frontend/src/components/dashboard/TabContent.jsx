import { OverviewTab } from './tabs/OverviewTab';
import { ExploreTab } from './tabs/ExploreTab';
import { HoldingsTab } from './tabs/HoldingsTab';
import { WatchlistTab } from './tabs/WatchlistTab';

export function TabContent({ 
  activeTab,
  portfolio,
  stockDetails,
  watchlist,
  stocksData,
  candleData,
  timeframe,
  setTimeframe,
  onSelectStock,
  onToggleWatchlist,
  executeTrade,
  formatCurrency,
  formatNumber,
  formatPercentage,
  marketStatus,
  searchQuery,
  searchResults,
  handleSearch
}) {
  switch (activeTab) {
    case 'overview':
      return (
        <OverviewTab 
          portfolio={portfolio}
          formatCurrency={formatCurrency}
          onSelectStock={onSelectStock}
        />
      );
    case 'explore':
      return (
        <ExploreTab
          stockDetails={stockDetails}
          candleData={candleData}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          searchQuery={searchQuery}
          searchResults={searchResults}
          handleSearch={handleSearch}
          onSelectStock={onSelectStock}
          onToggleWatchlist={onToggleWatchlist}
          watchlist={watchlist}
          portfolio={portfolio}
          formatCurrency={formatCurrency}
          marketStatus={marketStatus}
          executeTrade={executeTrade}
        />
      );
    case 'holdings':
      return (
        <HoldingsTab 
          portfolio={portfolio}
          formatCurrency={formatCurrency}
          onSelectStock={onSelectStock}
        />
      );
    case 'watchlist':
      return (
        <WatchlistTab 
          watchlist={watchlist}
          stocksData={stocksData}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
          onSelectStock={onSelectStock}
          onToggleWatchlist={onToggleWatchlist}
        />
      );
    default:
      return (
        <OverviewTab 
          portfolio={portfolio}
          formatCurrency={formatCurrency}
          onSelectStock={onSelectStock}
        />
      );
  }
}
