import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabaseDefaults } from '../../db/db';
import { seedSampleData } from '../../db/seed';
import { useAppStore } from '../../store/useAppStore';
import { BottomTabBar } from './BottomTabBar';
import { DashboardView } from '../../views/DashboardView';
import { TransactionsView } from '../../views/TransactionsView';
import { PeopleView } from '../../views/PeopleView';
import { AnalyticsView } from '../../views/AnalyticsView';
import { SettingsView } from '../../views/SettingsView';

// Modals
import { TransactionModal } from '../modals/TransactionModal';
import { RepayModal } from '../modals/RepayModal';
import { SettleConfirmModal } from '../modals/SettleConfirmModal';
import { DebtSlipModal } from '../modals/DebtSlipModal';
import { PersonModal } from '../modals/PersonModal';
import { PersonDetailSheet } from '../modals/PersonDetailSheet';
import { FilterSheet } from '../modals/FilterSheet';
import { PinLockScreen } from '../modals/PinLockScreen';

export const AppShell: React.FC = () => {
  const { activeTab, lockApp, isLocked } = useAppStore();
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  useEffect(() => {
    // Initialize DB defaults (categories & settings) with clean empty debts
    const setup = async () => {
      await initDatabaseDefaults();
    };
    setup();
  }, []);

  useEffect(() => {
    if (settings?.isPinEnabled && !isLocked) {
      // Optional initial lock on page refresh
    }
  }, [settings?.isPinEnabled]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transactions':
        return <TransactionsView />;
      case 'people':
        return <PeopleView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto bg-ios-bg-light dark:bg-ios-bg-dark text-ios-text-light dark:text-ios-text-dark shadow-2xl overflow-x-hidden">
      {/* Active Screen View */}
      {renderActiveView()}

      {/* iOS Cupertino Bottom Tab Bar */}
      <BottomTabBar />

      {/* Global Bottom Sheet Modals & Screens */}
      <TransactionModal />
      <RepayModal />
      <SettleConfirmModal />
      <DebtSlipModal />
      <PersonModal />
      <PersonDetailSheet />
      <FilterSheet />
      <PinLockScreen />
    </div>
  );
};
