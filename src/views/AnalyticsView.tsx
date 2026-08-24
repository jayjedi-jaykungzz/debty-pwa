import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PieChart, TrendingUp, TrendingDown, Calendar, Users, Award, ShieldAlert } from 'lucide-react';
import { db } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import { TopNavBar } from '../components/layout/TopNavBar';
import { Avatar } from '../components/ui/Avatar';
import { formatCurrency } from '../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { isPrivacyMode, openPersonDetail } = useAppStore();

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const currency = settings?.defaultCurrency || 'USD';
  const peopleMap = new Map(people.map((p) => [p.id, p]));

  // Active debts
  const activeTxs = transactions.filter((t) => t.status !== 'PAID');
  const lentTxs = activeTxs.filter((t) => t.type === 'LENT');
  const borrowedTxs = activeTxs.filter((t) => t.type === 'BORROWED');

  const totalLent = lentTxs.reduce((sum, t) => sum + t.remainingAmount, 0);
  const totalBorrowed = borrowedTxs.reduce((sum, t) => sum + t.remainingAmount, 0);
  const totalVolume = totalLent + totalBorrowed;

  const lentRatio = totalVolume > 0 ? Math.round((totalLent / totalVolume) * 100) : 50;
  const borrowedRatio = 100 - lentRatio;

  // Category Breakdown
  const categoryMap = new Map<string, number>();
  activeTxs.forEach((tx) => {
    const cat = tx.category || 'General';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + tx.remainingAmount);
  });
  const categoryStats = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      pct: totalVolume > 0 ? Math.round((amount / totalVolume) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top Debtors (People who owe me the most)
  const debtorMap = new Map<string, number>();
  lentTxs.forEach((tx) => {
    debtorMap.set(tx.personId, (debtorMap.get(tx.personId) || 0) + tx.remainingAmount);
  });
  const topDebtors = Array.from(debtorMap.entries())
    .map(([personId, amount]) => ({ person: peopleMap.get(personId), amount }))
    .filter((d) => Boolean(d.person))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Top Creditors (People I owe the most)
  const creditorMap = new Map<string, number>();
  borrowedTxs.forEach((tx) => {
    creditorMap.set(tx.personId, (creditorMap.get(tx.personId) || 0) + tx.remainingAmount);
  });
  const topCreditors = Array.from(creditorMap.entries())
    .map(([personId, amount]) => ({ person: peopleMap.get(personId), amount }))
    .filter((d) => Boolean(d.person))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // 30-Day Upcoming Cashflow Forecast
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 86400000);

  const upcomingReceivables = lentTxs
    .filter((t) => t.dueDate && new Date(t.dueDate) <= next30Days && new Date(t.dueDate) >= now)
    .reduce((sum, t) => sum + t.remainingAmount, 0);

  const upcomingPayables = borrowedTxs
    .filter((t) => t.dueDate && new Date(t.dueDate) <= next30Days && new Date(t.dueDate) >= now)
    .reduce((sum, t) => sum + t.remainingAmount, 0);

  return (
    <div className="min-h-screen pb-tab-safe">
      <TopNavBar title="Analytics" subtitle="Financial Insights & Ratios" showAdd={false} />

      <main className="px-5 py-3 space-y-4">
        {/* Ratio Gauge Card */}
        <div className="p-5 bg-ios-card-light dark:bg-ios-card-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ios-text-light dark:text-ios-text-dark">
              Debt vs Credit Ratio
            </h3>
            <span className="text-xs text-ios-text-secondaryLight font-medium">
              Total: {formatCurrency(totalVolume, currency, isPrivacyMode)}
            </span>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="h-4 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden flex">
            <div
              style={{ width: `${lentRatio}%` }}
              className="bg-ios-blue h-full transition-all duration-500"
            />
            <div
              style={{ width: `${borrowedRatio}%` }}
              className="bg-ios-orange h-full transition-all duration-500"
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-ios-blue" />
                <span>Owed to You</span>
              </div>
              <span className="font-bold text-ios-text-light dark:text-ios-text-dark">
                {lentRatio}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-400">
                <span className="w-2 h-2 rounded-full bg-ios-orange" />
                <span>You Owe</span>
              </div>
              <span className="font-bold text-ios-text-light dark:text-ios-text-dark">
                {borrowedRatio}%
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Cashflow Forecast */}
        <div className="p-5 bg-ios-card-light dark:bg-ios-card-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ios-blue" />
            <h3 className="text-sm font-bold text-ios-text-light dark:text-ios-text-dark">
              Next 30 Days Cashflow Forecast
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-2xl">
              <p className="text-[11px] text-ios-text-secondaryLight font-medium">
                Expected Inflow (Receivable)
              </p>
              <p
                className={`text-base font-black text-ios-blue mt-1 ${
                  isPrivacyMode ? 'blur-sm' : ''
                }`}
              >
                +{formatCurrency(upcomingReceivables, currency, isPrivacyMode)}
              </p>
            </div>
            <div className="p-3 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-2xl">
              <p className="text-[11px] text-ios-text-secondaryLight font-medium">
                Expected Outflow (Payable)
              </p>
              <p
                className={`text-base font-black text-ios-orange mt-1 ${
                  isPrivacyMode ? 'blur-sm' : ''
                }`}
              >
                -{formatCurrency(upcomingPayables, currency, isPrivacyMode)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Debtors & Creditors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Debtors */}
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ios-blue uppercase tracking-wider">
              <Award className="w-4 h-4" /> Top Debtors (Owe You)
            </div>
            {topDebtors.length === 0 ? (
              <p className="text-xs text-ios-text-secondaryLight py-2">No active lent debts.</p>
            ) : (
              <div className="space-y-2">
                {topDebtors.map(({ person, amount }) => (
                  <div
                    key={person?.id}
                    onClick={() => person && openPersonDetail(person.id)}
                    className="flex items-center justify-between p-2 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark cursor-pointer active:scale-98 transition-transform"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={person?.name || ''} avatarUrl={person?.avatarUrl} size="sm" />
                      <span className="text-xs font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                        {person?.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black text-ios-blue ${
                        isPrivacyMode ? 'blur-sm' : ''
                      }`}
                    >
                      {formatCurrency(amount, currency, isPrivacyMode)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Creditors */}
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ios-orange uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Top Creditors (You Owe)
            </div>
            {topCreditors.length === 0 ? (
              <p className="text-xs text-ios-text-secondaryLight py-2">No active borrowed debts.</p>
            ) : (
              <div className="space-y-2">
                {topCreditors.map(({ person, amount }) => (
                  <div
                    key={person?.id}
                    onClick={() => person && openPersonDetail(person.id)}
                    className="flex items-center justify-between p-2 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark cursor-pointer active:scale-98 transition-transform"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={person?.name || ''} avatarUrl={person?.avatarUrl} size="sm" />
                      <span className="text-xs font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                        {person?.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black text-ios-orange ${
                        isPrivacyMode ? 'blur-sm' : ''
                      }`}
                    >
                      {formatCurrency(amount, currency, isPrivacyMode)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-5 bg-ios-card-light dark:bg-ios-card-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-3">
          <h3 className="text-sm font-bold text-ios-text-light dark:text-ios-text-dark">
            Category Breakdown
          </h3>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-ios-text-secondaryLight py-2">No active debts.</p>
          ) : (
            <div className="space-y-2.5">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-ios-text-light dark:text-ios-text-dark">{cat.name}</span>
                    <span className="text-ios-text-secondaryLight font-semibold">
                      {formatCurrency(cat.amount, currency, isPrivacyMode)} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${cat.pct}%` }}
                      className="bg-ios-blue h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
