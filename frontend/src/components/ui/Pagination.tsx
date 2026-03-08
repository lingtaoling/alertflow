import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function getPageItems(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  if (currentPage > 4) items.push("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i);
  }
  if (currentPage < totalPages - 3) items.push("ellipsis");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

export interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  /** Optional label for the summary, e.g. "alert" → "Page 1 of 3 · 25 alerts" */
  itemLabel?: string;
}

export default function Pagination({
  total,
  limit,
  offset,
  onPageChange,
  itemLabel = "item",
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const [goToPage, setGoToPage] = useState("");

  if (totalPages <= 1) return null;

  function handleGoToPage() {
    const page = parseInt(goToPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange((page - 1) * limit);
      setGoToPage("");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-ink-200">
      <div className="flex items-center gap-3">
        <span className="text-ink-500 text-sm">
          Page {currentPage} of {totalPages} · {total} {itemLabel}
          {total !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center overflow-hidden rounded-full border border-ink-200">
        <button
          className="px-2.5 py-1.5 border-r border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={offset === 0}
          onClick={() => onPageChange(0)}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          className="px-2.5 py-1.5 border-r border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={offset === 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {getPageItems(currentPage, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 py-1.5 text-ink-400 text-sm border-r border-ink-200"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              className={`min-w-[2.25rem] px-2 py-1.5 text-sm font-medium border-r border-ink-200 last:border-r-0 transition-colors ${
                item === currentPage
                  ? "bg-gradient-to-r from-signal-orange to-signal-orange-light text-ink-900"
                  : "text-ink-700 hover:bg-ink-100"
              }`}
              onClick={() => onPageChange((item - 1) * limit)}
            >
              {item}
            </button>
          ),
        )}
        <button
          className="px-2.5 py-1.5 border-l border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="px-2.5 py-1.5 text-ink-600 hover:text-ink-800 hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={offset + limit >= total}
          onClick={() => onPageChange((totalPages - 1) * limit)}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
