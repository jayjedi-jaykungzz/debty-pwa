import React from 'react';
import { DebtStatus } from '../../types';

interface StatusBadgeProps {
  status: DebtStatus;
  isDueSoon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isDueSoon, className = '' }) => {
  if (status === 'PAID') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Settled
      </span>
    );
  }

  if (status === 'OVERDUE') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
        Overdue
      </span>
    );
  }

  if (isDueSoon) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        Due Soon
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
      Active
    </span>
  );
};
