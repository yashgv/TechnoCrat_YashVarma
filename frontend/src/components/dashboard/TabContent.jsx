import { OverviewTab } from './tabs/OverviewTab';
import { ExploreTab } from './tabs/ExploreTab';
import { HoldingsTab } from './tabs/HoldingsTab';
import { WatchlistTab } from './tabs/WatchlistTab';

export function TabContent({ activeTab, ...props }) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab {...props} />;
    case 'explore':
      return <ExploreTab {...props} />;
    case 'holdings':
      return <HoldingsTab {...props} />;
    case 'watchlist':
      return <WatchlistTab {...props} />;
    default:
      return <OverviewTab {...props} />;
  }
}
