import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Receipt, Users, PieChart, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TabType } from '../../types';
import { haptics } from '../../utils/haptics';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
  { id: 'transactions', label: 'Debts', icon: Receipt },
  { id: 'people', label: 'People', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-tab-light dark:glass-tab-dark pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (!isActive) {
                  haptics.impactLight();
                  setActiveTab(tab.id);
                }
              }}
              className="relative flex-1 flex flex-col items-center justify-center h-full py-1 text-center select-none group"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                >
                  <Icon
                    className={`w-5.5 h-5.5 transition-colors ${
                      isActive
                        ? 'text-ios-blue stroke-[2.3]'
                        : 'text-ios-text-secondaryLight dark:text-ios-text-secondaryDark group-hover:text-ios-text-light dark:group-hover:text-ios-text-dark'
                    }`}
                  />
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="tab-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-ios-blue rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive
                    ? 'text-ios-blue font-semibold'
                    : 'text-ios-text-secondaryLight dark:text-ios-text-secondaryDark'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
