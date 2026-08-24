import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DebtDirection, DebtStatus } from '../../types';
import { haptics } from '../../utils/haptics';

export const FilterSheet: React.FC = () => {
  const { isFilterSheetOpen, closeFilterSheet, filters, setFilters, resetFilters } = useAppStore();
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  return (
    <BottomSheet isOpen={isFilterSheetOpen} onClose={closeFilterSheet} title="Filter & Sort">
      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            DEBT STATUS
          </label>
          <SegmentedControl
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'PAID', label: 'Settled' },
            ]}
            value={filters.status || 'ALL'}
            onChange={(val) => setFilters({ status: val as DebtStatus | 'ALL' })}
            size="sm"
          />
        </div>

        {/* Direction Filter */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            DIRECTION
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Both', val: undefined },
              { label: 'I Lent', val: 'LENT' as DebtDirection },
              { label: 'I Borrowed', val: 'BORROWED' as DebtDirection },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  haptics.impactLight();
                  setFilters({ direction: item.val });
                }}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${
                  filters.direction === item.val
                    ? 'bg-ios-blue text-white font-semibold shadow-sm'
                    : 'bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight dark:text-ios-text-secondaryDark'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            SORT BY
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as any })}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3.5 py-3 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none"
          >
            <option value="date_desc">Newest First (Creation Date)</option>
            <option value="date_asc">Oldest First</option>
            <option value="due_date">Due Date (Upcoming first)</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            CATEGORY
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilters({ category: undefined })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                !filters.category
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  haptics.impactLight();
                  setFilters({ category: filters.category === c.name ? undefined : c.name });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filters.category === c.name
                    ? 'bg-ios-blue text-white shadow-sm'
                    : 'bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter by Person */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            FILTER BY CONTACT
          </label>
          <select
            value={filters.personId || ''}
            onChange={(e) => setFilters({ personId: e.target.value || undefined })}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3.5 py-3 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none"
          >
            <option value="">All Contacts</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              resetFilters();
              closeFilterSheet();
            }}
            className="flex-1 py-3 rounded-2xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-xs font-semibold text-ios-text-light dark:text-ios-text-dark"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              closeFilterSheet();
            }}
            className="flex-1 py-3 rounded-2xl bg-ios-blue text-white text-xs font-bold shadow-ios-glow-blue"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
