import { Calendar, Filter, SlidersHorizontal } from 'lucide-react';

interface DateRangeOption {
  label: string;
  value: number;
}

interface FilterControlsProps {
  dateRange?: number;
  onDateRangeChange?: (days: number) => void;
  showServiceType?: boolean;
  serviceType?: string;
  onServiceTypeChange?: (type: string) => void;
  showProvider?: boolean;
  provider?: string;
  onProviderChange?: (provider: string) => void;
  showStatus?: boolean;
  status?: string;
  onStatusChange?: (status: string) => void;
  showSortBy?: boolean;
  sortBy?: string;
  onSortByChange?: (sort: string) => void;
  showSegment?: boolean;
  segment?: string;
  onSegmentChange?: (segment: string) => void;
  customFilters?: React.ReactNode;
}

export function FilterControls({
  dateRange,
  onDateRangeChange,
  showServiceType,
  serviceType,
  onServiceTypeChange,
  showProvider,
  provider,
  onProviderChange,
  showStatus,
  status,
  onStatusChange,
  showSortBy,
  sortBy,
  onSortByChange,
  showSegment,
  segment,
  onSegmentChange,
  customFilters,
}: FilterControlsProps) {
  const dateRangeOptions: DateRangeOption[] = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ];

  const serviceTypes = ['all', 'content', 'images', 'video'];
  // Updated to match actual providers in codebase:
  // - Content: openai only
  // - Images: openai (DALL-E), flux, stability, ideogram
  // - Video: runway (veo3), luma (ray-2)
  const providers = ['all', 'openai', 'flux', 'stability', 'ideogram', 'runway', 'luma'];
  const statuses = ['all', 'success', 'failed'];
  const segments = ['all', 'free', 'pro', 'enterprise'];

  return (
    <div className="terminal-filter-bar flex-wrap">
      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#33ff33]" />
          <div className="flex items-center gap-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onDateRangeChange(option.value)}
                className={`terminal-filter__chip ${
                  dateRange === option.value ? 'terminal-filter__chip--active' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Type Filter */}
      {showServiceType && onServiceTypeChange && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#33ff33]" />
          <select
            value={serviceType}
            onChange={(e) => onServiceTypeChange(e.target.value)}
            className="terminal-select capitalize"
          >
            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Services' : type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Provider Filter */}
      {showProvider && onProviderChange && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#33ff33]" />
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="terminal-select capitalize"
          >
            {providers.map((prov) => (
              <option key={prov} value={prov}>
                {prov === 'all' ? 'All Providers' : prov}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      {showStatus && onStatusChange && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#33ff33]" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="terminal-select capitalize"
          >
            {statuses.map((stat) => (
              <option key={stat} value={stat}>
                {stat === 'all' ? 'All Status' : stat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User Segment Filter */}
      {showSegment && onSegmentChange && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#33ff33]" />
          <select
            value={segment}
            onChange={(e) => onSegmentChange(e.target.value)}
            className="terminal-select capitalize"
          >
            {segments.map((seg) => (
              <option key={seg} value={seg}>
                {seg === 'all' ? 'All Plans' : seg}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort By Filter */}
      {showSortBy && onSortByChange && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#33ff33]" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="terminal-select"
          >
            <option value="calls">Most Calls</option>
            <option value="cost">Highest Cost</option>
            <option value="latency">Fastest</option>
            <option value="success">Most Reliable</option>
          </select>
        </div>
      )}

      {/* Custom Filters Slot */}
      {customFilters}
    </div>
  );
}
