import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../db/db';
import { seedSampleData } from '../db/seed';
import { useAppStore } from '../store/useAppStore';
import { TopNavBar } from '../components/layout/TopNavBar';
import { SwipeableCard } from '../components/ui/SwipeableCard';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate, formatRelativeDueDate } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const DashboardView: React.FC = () => {
  const {
    isPrivacyMode,
    openAddTransaction,
    openRepayModal,
    openSettleModal,
    openSlipModal,
    openEditTransaction,
    openPersonDetail,
    setActiveTab,
  } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const peopleMap = new Map(people.map((p) => [p.id, p]));

  // Financial calculations
  const currency = settings?.defaultCurrency || 'USD';

  const totalLent = transactions
    .filter((t) => t.type === 'LENT' && t.status !== 'PAID')
    .reduce((sum, t) => sum + t.remainingAmount, 0);

  const totalBorrowed = transactions
    .filter((t) => t.type === 'BORROWED' && t.status !== 'PAID')
    .reduce((sum, t) => sum + t.remainingAmount, 0);

  const netBalance = totalLent - totalBorrowed;

  // Overdue & Due Soon alerts
  const urgentTransactions = transactions.filter((t) => {
    if (t.status === 'PAID') return false;
    const rel = formatRelativeDueDate(t.dueDate);
    return rel.isOverdue || rel.isDueSoon;
  });

  // Recent 6 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

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
        title="Debty"
        subtitle="Private Debt & Credit Tracker"
        showAdd={true}
        onAddClick={() => openAddTransaction()}
      />

      <main className="px-5 py-3 space-y-5">
        {/* Net Position Hero Card */}
        <div className="relative overflow-hidden rounded-[26px] p-6 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white shadow-ios-elevated border border-white/10">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
              netBalance >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`}
          />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

          {/* Top Pill / User Label */}
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
              Net Balance Position
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 text-[10px] font-medium backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline & Encrypted</span>
            </div>
          </div>

          {/* Net Amount */}
          <div className="mt-3 relative z-10">
            <h2
              className={`text-4xl font-black tracking-tight ${
                isPrivacyMode
                  ? 'blur-sm'
                  : netBalance > 0
                  ? 'text-white'
                  : netBalance < 0
                  ? 'text-rose-300'
                  : 'text-white'
              }`}
            >
              {netBalance < 0 ? '-' : ''}
              {formatCurrency(Math.abs(netBalance), currency, isPrivacyMode)}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {netBalance > 0
                ? '🟢 Positive Net Position (More owed to you)'
                : netBalance < 0
                ? '🔴 Negative Net Position (You owe more)'
                : 'Balanced Net Position'}
            </p>
          </div>

          {/* Lent vs Borrowed Split */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10 relative z-10">
            {/* Owed to me */}
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>I Lent (Receivable)</span>
              </div>
              <p
                className={`text-lg font-bold text-white mt-1 ${
                  isPrivacyMode ? 'blur-sm' : ''
                }`}
              >
                {formatCurrency(totalLent, currency, isPrivacyMode)}
              </p>
            </div>

            {/* I Owe */}
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>I Borrowed (Payable)</span>
              </div>
              <p
                className={`text-lg font-bold text-white mt-1 ${
                  isPrivacyMode ? 'blur-sm' : ''
                }`}
              >
                {formatCurrency(totalBorrowed, currency, isPrivacyMode)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Action Shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              openAddTransaction('LENT');
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-ios-blue text-white font-bold text-sm shadow-ios-glow-blue active:scale-[0.98] transition-all"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>I Lent Money</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              openAddTransaction('BORROWED');
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-ios-card-light dark:bg-ios-card-dark text-ios-text-light dark:text-ios-text-dark font-bold text-sm border border-black/5 dark:border-white/10 shadow-ios-card active:scale-[0.98] transition-all"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5] text-ios-orange" />
            <span>I Borrowed</span>
          </button>
        </div>

        {/* Urgent & Due Soon Alerts */}
        {urgentTransactions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ios-red flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Action Required ({urgentTransactions.length})
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {urgentTransactions.map((tx) => {
                const person = peopleMap.get(tx.personId);
                const relDate = formatRelativeDueDate(tx.dueDate);
                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      haptics.impactLight();
                      openEditTransaction(tx);
                    }}
                    className="min-w-[240px] p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 flex-shrink-0 cursor-pointer active:scale-98 transition-transform"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                        {person?.name || 'Contact'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          relDate.isOverdue
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {relDate.text}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
                        {tx.type === 'LENT' ? 'They owe you' : 'You owe'}
                      </span>
                      <span
                        className={`text-base font-black text-rose-600 dark:text-rose-400 ${
                          isPrivacyMode ? 'blur-sm' : ''
                        }`}
                      >
                        {formatCurrency(tx.remainingAmount, tx.currency, isPrivacyMode)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State / 1-Click Sample Data Banner */}
        {transactions.length === 0 && (
          <div className="p-6 rounded-3xl bg-ios-card-light dark:bg-ios-card-dark border border-black/5 dark:border-white/5 text-center shadow-ios-card space-y-3">
            <div className="w-14 h-14 rounded-full bg-ios-blue/10 text-ios-blue flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-ios-text-light dark:text-ios-text-dark">
              No debts recorded yet
            </h3>
            <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark max-w-xs mx-auto">
              Start tracking money you lent to friends or borrowed from colleagues, or load sample data to explore.
            </p>
            <button
              type="button"
              onClick={async () => {
                haptics.impactMedium();
                await seedSampleData(true);
                haptics.notificationSuccess();
              }}
              className="px-5 py-2.5 rounded-xl bg-ios-blue text-white text-xs font-bold shadow-ios-glow-blue active:scale-95 transition-all"
            >
              Load Sample Data
            </button>
          </div>
        )}

        {/* Recent Transactions List */}
        {recentTransactions.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
                Recent Debts (Swipe for quick actions)
              </h3>
              <button
                type="button"
                onClick={() => {
                  haptics.impactLight();
                  setActiveTab('transactions');
                }}
                className="text-xs text-ios-blue font-semibold flex items-center hover:underline"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentTransactions.map((tx) => {
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
                      {/* Left: Contact Avatar & Info */}
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
                            {tx.category} {tx.notes ? `• ${tx.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Status */}
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
          </div>
        )}
      </main>
    </div>
  );
};
