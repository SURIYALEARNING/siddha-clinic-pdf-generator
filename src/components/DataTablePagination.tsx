import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface DataTablePaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  idPrefix?: string;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'records',
  idPrefix = 'dash-history-pagination',
}) => {
  if (totalRecords === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    onPageSizeChange(newSize);
  };

  return (
    <div
      id={`${idPrefix}-container`}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3.5 border-t border-slate-100 text-xs text-slate-500"
    >
      {/* Left: Showing X to Y of Z records + page size dropdown */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="whitespace-nowrap">
          Showing <span className="font-bold text-slate-800">{startRecord}</span> to{' '}
          <span className="font-bold text-slate-800">{endRecord}</span> of{' '}
          <span className="font-bold text-slate-800">{totalRecords}</span> {itemLabel}
        </p>

        <div className="relative inline-flex items-center shrink-0">
          <select
            id={`${idPrefix}-size-select`}
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Records per page"
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1 pr-6 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      </div>

      {/* Right: Prev button, Page indicator, Next button */}
      <div className="flex items-center gap-2 self-center sm:self-auto">
        <button
          id={`${idPrefix}-prev`}
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-xs"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span
          id={`${idPrefix}-indicator`}
          className="px-3.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-xs whitespace-nowrap"
        >
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          id={`${idPrefix}-next`}
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= totalPages}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-xs"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
