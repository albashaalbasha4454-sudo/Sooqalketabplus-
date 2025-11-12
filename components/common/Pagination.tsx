import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const pagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + pagesToShow - 1);

  if (endPage - startPage + 1 < pagesToShow) {
    startPage = Math.max(1, endPage - pagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems);

  const PageButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    isActive?: boolean;
    ariaLabel: string;
  }> = ({onClick, disabled, children, isActive, ariaLabel}) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-3 py-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 ${
          isActive 
            ? 'bg-indigo-600 text-white font-bold shadow-sm border border-indigo-700' 
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
        <div className="text-slate-600 mb-2 sm:mb-0">
            عرض {firstItem}-{lastItem} من أصل {totalItems} سجلات
        </div>
        <nav className="flex justify-center items-center space-x-1" dir="ltr">
            <PageButton onClick={() => onPageChange(1)} disabled={currentPage === 1} ariaLabel="اذهب إلى الصفحة الأولى">&laquo;</PageButton>
            <PageButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} ariaLabel="اذهب إلى الصفحة السابقة">&lsaquo;</PageButton>
            
            {startPage > 1 && <span className="px-3 py-1 text-slate-400">...</span>}
            
            {pageNumbers.map(number => (
                <PageButton key={number} onClick={() => onPageChange(number)} isActive={currentPage === number} ariaLabel={`اذهب إلى صفحة ${number}`}>
                    {number}
                </PageButton>
            ))}
            
            {endPage < totalPages && <span className="px-3 py-1 text-slate-400">...</span>}
            
            <PageButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} ariaLabel="اذهب إلى الصفحة التالية">&rsaquo;</PageButton>
            <PageButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} ariaLabel="اذهب إلى الصفحة الأخيرة">&raquo;</PageButton>
        </nav>
    </div>
  );
};

export default Pagination;