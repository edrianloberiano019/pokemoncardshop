import React from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const goTo = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    if (clamped !== currentPage) onPageChange(clamped);
  };

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="px-6 py-2 flex gap-2 justify-center items-center font-light">
      <div className="flex gap-2">
        {pages.map((p, idx) =>
          p === "..." ? (
            <div key={`ellipsis-${idx}`}>...</div>
          ) : (
            <div
              key={p}
              onClick={() => goTo(p)}
              className={` bg-[#99AD7A]  rounded-sm transition-all px-3 p-1 ${
                p === currentPage
                  ? " opacity-40  cursor-not-allowed"
                  : "cursor-pointer hover:bg-[#7f9066]"
              }`}
            >
              {p}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
