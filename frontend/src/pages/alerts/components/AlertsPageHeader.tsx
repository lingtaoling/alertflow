import { Plus, Search, X } from "lucide-react";
import parkleOrangeSvg from "../../../assets/images/parkle-orange.svg";

interface Props {
  isAdmin: boolean;
  orgName?: string | null;
  searchQuery: string | undefined;
  onSearchChange: (value: string) => void;
  onCreateAlert: () => void;
}

export default function AlertsPageHeader({
  isAdmin,
  orgName,
  searchQuery,
  onSearchChange,
  onCreateAlert,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mb-2">
      <h1 className="text-lg font-semibold text-ink-700 shrink-0">
        Alerts
        {isAdmin ? " – All organizations" : orgName ? ` – ${orgName}` : ""}
      </h1>
      <div className="relative flex-1 max-w-md mx-4 min-w-0">
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(searchQuery ?? "").trim() && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <Search size={14} className="text-ink-400 shrink-0" />
        </div>
        <input
          type="text"
          placeholder="Search alerts by title or description..."
          value={searchQuery ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-12 py-1.5 text-sm bg-transparent border-0 border-b border-ink-300 rounded-none placeholder:text-ink-400 text-ink-700 focus:outline-none focus:border-signal-orange focus:border-b"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="new-alert-btn-wrapper group relative inline-flex overflow-visible">
          <button
            className="btn-primary px-3 py-1.5 text-base font-bold bg-transparent hover:bg-transparent text-signal-orange relative z-10"
            onClick={onCreateAlert}
          >
            <Plus size={12} />
            <span className="hidden sm:inline">New Alert</span>
          </button>
          <img
            src={parkleOrangeSvg}
            alt=""
            className="new-alert-parkle absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none transition-opacity duration-200 z-10 object-center origin-center scale-x-125 translate-x-2"
          />
        </div>
      </div>
    </div>
  );
}
