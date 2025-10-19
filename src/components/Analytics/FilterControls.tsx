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
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/40" />
          <div className="flex items-center gap-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onDateRangeChange(option.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${dateRange === option.value
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/[0.07]'
                  }
                `}
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
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={serviceType}
            onChange={(e) => onServiceTypeChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white border border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/50 capitalize"
          >
            {serviceTypes.map((type) => (
              <option key={type} value={type} className="bg-slate-900">
                {type === 'all' ? 'All Services' : type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Provider Filter */}
      {showProvider && onProviderChange && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/40" />
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white border border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/50 capitalize"
          >
            {providers.map((prov) => (
              <option key={prov} value={prov} className="bg-slate-900">
                {prov === 'all' ? 'All Providers' : prov}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      {showStatus && onStatusChange && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white border border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/50 capitalize"
          >
            {statuses.map((stat) => (
              <option key={stat} value={stat} className="bg-slate-900">
                {stat === 'all' ? 'All Status' : stat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User Segment Filter */}
      {showSegment && onSegmentChange && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={segment}
            onChange={(e) => onSegmentChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white border border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/50 capitalize"
          >
            {segments.map((seg) => (
              <option key={seg} value={seg} className="bg-slate-900">
                {seg === 'all' ? 'All Plans' : seg}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort By Filter */}
      {showSortBy && onSortByChange && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/40" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white border border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="calls" className="bg-slate-900">Most Calls</option>
            <option value="cost" className="bg-slate-900">Highest Cost</option>
            <option value="latency" className="bg-slate-900">Fastest</option>
            <option value="success" className="bg-slate-900">Most Reliable</option>
          </select>
        </div>
      )}

      {/* Custom Filters Slot */}
      {customFilters}
    </div>
  );
}
