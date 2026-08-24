import React from 'react';
import { Eye, EyeOff, Plus, SlidersHorizontal, Lock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { haptics } from '../../utils/haptics';

interface TopNavBarProps {
  title: string;
  subtitle?: string;
  showAdd?: boolean;
  showFilter?: boolean;
  onAddClick?: () => void;
  onFilterClick?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  subtitle,
  showAdd = true,
  showFilter = false,
  onAddClick,
  onFilterClick,
}) => {
  const { isPrivacyMode, togglePrivacyMode, openAddTransaction, openFilterSheet, lockApp } = useAppStore();

  return (
    <header className="sticky top-0 z-30 w-full glass-nav-light dark:glass-nav-dark pt-safe transition-colors">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left / Title */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ios-text-light dark:text-ios-text-dark">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs font-medium text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Privacy Blur Toggle */}
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              togglePrivacyMode();
            }}
            title={isPrivacyMode ? 'Show Balances' : 'Hide Balances (Privacy)'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isPrivacyMode
                ? 'bg-ios-blue text-white shadow-ios-glow-blue'
                : 'bg-black/5 dark:bg-white/10 text-ios-text-light dark:text-ios-text-dark hover:bg-black/10 dark:hover:bg-white/20'
            }`}
          >
            {isPrivacyMode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>

          {/* Filter Button (if enabled) */}
          {showFilter && (
            <button
              type="button"
              onClick={() => {
                haptics.impactLight();
                if (onFilterClick) onFilterClick();
                else openFilterSheet();
              }}
              className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-ios-text-light dark:text-ios-text-dark hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Quick Add Button */}
          {showAdd && (
            <button
              type="button"
              onClick={() => {
                haptics.impactMedium();
                if (onAddClick) onAddClick();
                else openAddTransaction();
              }}
              className="w-9 h-9 rounded-full bg-ios-blue text-white flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
