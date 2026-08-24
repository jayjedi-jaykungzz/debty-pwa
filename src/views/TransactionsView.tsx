import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, SlidersHorizontal, Plus, X } from 'lucide-react';
import { db } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import { TopNavBar } from '../components/layout/TopNavBar';
import { SwipeableCard } from '../components/ui/SwipeableCard';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate, formatRelativeDueDate } from '../utils/formatters';
import { haptics } from '../utils/haptics';

type FilterTab = 'ALL' | 'LENT' | 'BORROWED' | 'OVERDUE' | 'PAID';

export const TransactionsView: React.FC = () => {
  const {
    isPrivacyMode,
    openAddTransaction,
    openRepayModal,
    openSettleModal,
    openSlipModal,
    openEditTransaction,
    openFilterSheet,
    filters,
    setFilters,
  } = useAppStore();

  const [activeSegment, setActiveSegment] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const peopleMap = new Map(people.map((p) => [p.id, p]));
  const defaultCurrency = settings?.defaultCurrency || 'USD';

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const person = peopleMap.get(tx.personId);
    const personName = person?.name.toLowerCase() || '';
    const notes = (tx.notes || '').toLowerCase();
    const category = (tx.category || '').toLowerCase();
    const q = search.toLowerCase().trim();

    // Text search
    if (q && !personName.includes(q) && !notes.includes(q) && !category.includes(q)) {
      return false;
    }

    // Segment filter
    if (activeSegment === 'LENT' && tx.type !== 'LENT') return false;
    if (activeSegment === 'BORROWED' && tx.type !== 'BORROWED') return false;
    if (activeSegment === 'OVERDUE' && tx.status !== 'OVERDUE') return false;
    if (activeSegment === 'PAID' && tx.status !== 'PAID') return false;
    if (activeSegment === 'ALL' && filters.status && filters.status !== 'ALL' && tx.status !== filters.status) return false;

    // Advanced category & person filter
    if (filters.category && tx.category !== filters.category) return false;
    if (filters.personId && tx.personId !== filters.personId) return false;

    return true;
  });

  // Sort transactions
  filtered.sort((a, b) => {
    if (filters.sortBy === 'amount_desc') return b.remainingAmount - a.remainingAmount;
    if (filters.sortBy === 'amount_asc') return a.remainingAmount - b.remainingAmount;
    if (filters.sortBy === 'due_date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (filters.sortBy === 'date_asc') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const totalFilteredAmount = filtered.reduce(
    (acc, t) => acc + (t.status === 'PAID' ? t.amount : t.remainingAmount),
    0
  );

  const handleDelete = async (id: string) => {
    if (confirm('Delete this debt record?')) {
      haptics.impactHeavy();
      await db.paymentLogs.where('transactionId').equals(id).delete();
      await db.transactions.delete(id);
      haptics.notificationSuccess();
    }
  };

  return (
    <div className="min-h-screen pb-tab-safe">
      <TopNavBar
        title="Debts & Credits"
        subtitle={`${filtered.length} total records`}
        showAdd={true}
        showFilter={true}
        onAddClick={() => openAddTransaction()}
        onFilterClick={() => openFilterSheet()}
      />

      <main className="px-5 py-3 space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by contact, category, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-2xl pl-9 pr-8 py-2.5 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'LENT', label: 'I Lent' },
            { id: 'BORROWED', label: 'I Borrowed' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'PAID', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptics.impactLight();
                setActiveSegment(tab.id as FilterTab);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSegment === tab.id
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight dark:text-ios-text-secondaryDark hover:text-ios-text-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Summary Banner */}
        <div className="flex items-center justify-between px-1 text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark font-medium">
          <span>{filtered.length} debts matched</span>
          <span>
            Total Volume:{' '}
            <strong className="text-ios-text-light dark:text-ios-text-dark">
              {formatCurrency(totalFilteredAmount, defaultCurrency, isPrivacyMode)}
            </strong>
          </span>
        </div>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ios-text-secondaryLight text-xs">
            No matching transactions found.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => {
              const person = peopleMap.get(tx.personId);
              const isLent = tx.type === 'LENT';
              const isPaid = tx.status === 'PAID';
              const relDate = formatRelativeDueDate(tx.dueDate);

              return (
                <SwipeableCard
                  key={tx.id}
                  onRepay={() => openRepayModal(tx)}
                  onSettle={() => openSettleModal(tx)}
                  onShare={() => openSlipModal(tx)}
                  onDelete={() => handleDelete(tx.id)}
                  isPaid={isPaid}
                >
                  <div
                    onClick={() => {
                      haptics.impactLight();
                      openEditTransaction(tx);
                    }}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={person?.name || 'Contact'}
                        avatarUrl={person?.avatarUrl}
                        colorTag={person?.colorTag}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                            {person?.name || 'Contact'}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                              isLent
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            }`}
                          >
                            {isLent ? 'Lent' : 'Borrowed'}
                          </span>
                        </div>
                        <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark truncate mt-0.5">
                          {tx.category} • {formatDate(tx.startDate, 'MMM d, yyyy')}
                        </p>
                        {tx.notes && (
                          <p className="text-[11px] text-ios-text-secondaryLight truncate italic">
                            "{tx.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-3">
                      <p
                        className={`text-base font-black ${
                          isPaid
                            ? 'text-ios-text-secondaryLight line-through'
                            : isLent
                            ? 'text-ios-text-light dark:text-ios-text-dark'
                            : 'text-ios-orange'
                        } ${isPrivacyMode ? 'blur-sm' : ''}`}
                      >
                        {formatCurrency(
                          isPaid ? tx.amount : tx.remainingAmount,
                          tx.currency,
                          isPrivacyMode
                        )}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={tx.status} isDueSoon={relDate.isDueSoon} />
                      </div>
                    </div>
                  </div>
                </SwipeableCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
