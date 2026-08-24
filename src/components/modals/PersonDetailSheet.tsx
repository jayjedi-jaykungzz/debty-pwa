import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Mail, Plus, CheckCircle, Trash2, Edit, Receipt, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';

export const PersonDetailSheet: React.FC = () => {
  const {
    isPersonDetailOpen,
    selectedPersonId,
    closePersonDetail,
    openEditPerson,
    openAddTransaction,
    openRepayModal,
    openSlipModal,
    isPrivacyMode,
  } = useAppStore();

  const person = useLiveQuery(
    () => (selectedPersonId ? db.people.get(selectedPersonId) : undefined),
    [selectedPersonId]
  );

  const transactions = useLiveQuery(
    () =>
      selectedPersonId
        ? db.transactions.where('personId').equals(selectedPersonId).reverse().sortBy('createdAt')
        : [],
    [selectedPersonId]
  ) || [];

  const paymentLogs = useLiveQuery(
    () =>
      selectedPersonId
        ? db.paymentLogs.where('personId').equals(selectedPersonId).reverse().sortBy('paidAt')
        : [],
    [selectedPersonId]
  ) || [];

  if (!person) return null;

  // Calculate Net Position for this person
  const activeLent = transactions
    .filter((t) => t.type === 'LENT' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.remainingAmount, 0);

  const activeBorrowed = transactions
    .filter((t) => t.type === 'BORROWED' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.remainingAmount, 0);

  const netBalance = activeLent - activeBorrowed; // >0: they owe me, <0: I owe them

  const handleSettleAll = async () => {
    haptics.impactHeavy();
    const activeTxs = transactions.filter((t) => t.status !== 'PAID' && t.remainingAmount > 0);
    if (activeTxs.length === 0) return;

    for (const tx of activeTxs) {
      await db.paymentLogs.put({
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        transactionId: tx.id,
        personId: tx.personId,
        amount: tx.remainingAmount,
        paidAt: new Date().toISOString(),
        note: 'Settle-All batch payment',
        remainingAfterPayment: 0,
      });

      await db.transactions.update(tx.id, {
        remainingAmount: 0,
        status: 'PAID',
        updatedAt: new Date().toISOString(),
      });
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    haptics.notificationSuccess();
  };

  const handleDeletePerson = async () => {
    if (confirm(`Are you sure you want to delete ${person.name} and all associated records?`)) {
      haptics.impactHeavy();
      await db.transactions.where('personId').equals(person.id).delete();
      await db.paymentLogs.where('personId').equals(person.id).delete();
      await db.people.delete(person.id);
      haptics.notificationSuccess();
      closePersonDetail();
    }
  };

  // Combine transactions and payment logs into a unified timeline ledger
  type LedgerItem =
    | { type: 'TX'; date: string; data: (typeof transactions)[0] }
    | { type: 'PAYMENT'; date: string; data: (typeof paymentLogs)[0] };

  const timelineItems: LedgerItem[] = [
    ...transactions.map((tx) => ({ type: 'TX' as const, date: tx.createdAt, data: tx })),
    ...paymentLogs.map((p) => ({ type: 'PAYMENT' as const, date: p.paidAt, data: p })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <BottomSheet isOpen={isPersonDetailOpen} onClose={closePersonDetail} title={person.name}>
      <div className="space-y-5">
        {/* Contact Profile Header */}
        <div className="flex items-center gap-3.5 p-4 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-2xl border border-black/5 dark:border-white/5">
          <Avatar name={person.name} avatarUrl={person.avatarUrl} colorTag={person.colorTag} size="lg" />
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-ios-text-light dark:text-ios-text-dark truncate">
              {person.name}
            </h4>
            {person.notes && (
              <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark truncate">
                {person.notes}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-ios-blue">
              {person.phone && (
                <a href={`tel:${person.phone}`} className="flex items-center gap-1 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} className="flex items-center gap-1 hover:underline">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              openEditPerson(person);
            }}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-ios-text-secondaryLight hover:text-ios-text-light"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Net Balance Banner */}
        <div
          className={`p-4 rounded-2xl border ${
            netBalance > 0
              ? 'bg-ios-blue/10 border-ios-blue/20 text-ios-blue'
              : netBalance < 0
              ? 'bg-ios-red/10 border-ios-red/20 text-ios-red'
              : 'bg-ios-green/10 border-ios-green/20 text-ios-green'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider">
            {netBalance > 0
              ? 'Owes You (Net Receivable)'
              : netBalance < 0
              ? 'You Owe (Net Payable)'
              : 'All Settled Up'}
          </p>
          <h3 className="text-2xl font-black mt-0.5">
            {formatCurrency(Math.abs(netBalance), 'USD', isPrivacyMode)}
          </h3>
          <div className="flex justify-between text-xs font-medium mt-2 pt-2 border-t border-black/5 dark:border-white/10">
            <span>Total Lent: {formatCurrency(activeLent, 'USD', isPrivacyMode)}</span>
            <span>Total Borrowed: {formatCurrency(activeBorrowed, 'USD', isPrivacyMode)}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              openAddTransaction('LENT', person.id);
            }}
            className="flex-1 py-2.5 rounded-xl bg-ios-blue text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> New Debt
          </button>
          {transactions.some((t) => t.status !== 'PAID' && t.remainingAmount > 0) && (
            <button
              type="button"
              onClick={handleSettleAll}
              className="flex-1 py-2.5 rounded-xl bg-ios-green text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Settle All
            </button>
          )}
        </div>

        {/* Timeline Ledger */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-2.5">
            Ledger Timeline ({timelineItems.length})
          </h5>

          {timelineItems.length === 0 ? (
            <p className="text-xs text-center py-6 text-ios-text-secondaryLight">
              No transactions or payment history yet.
            </p>
          ) : (
            <div className="space-y-2">
              {timelineItems.map((item, index) => {
                if (item.type === 'TX') {
                  const tx = item.data;
                  const isLent = tx.type === 'LENT';
                  return (
                    <div
                      key={`tx-${tx.id}-${index}`}
                      className="p-3 bg-ios-card-light dark:bg-ios-card-dark rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isLent ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                          }`}
                        >
                          {isLent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ios-text-light dark:text-ios-text-dark">
                            {tx.category} {tx.notes ? `• ${tx.notes}` : ''}
                          </p>
                          <p className="text-[10px] text-ios-text-secondaryLight">
                            {formatDate(tx.startDate)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-xs font-bold text-ios-text-light dark:text-ios-text-dark">
                            {formatCurrency(tx.remainingAmount, tx.currency, isPrivacyMode)}
                          </p>
                          <StatusBadge status={tx.status} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            haptics.impactLight();
                            openSlipModal(tx);
                          }}
                          className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-ios-text-secondaryLight hover:text-ios-blue"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  const pay = item.data;
                  return (
                    <div
                      key={`pay-${pay.id}-${index}`}
                      className="p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Repayment Log
                          </span>
                          {pay.note && <span className="text-gray-500 ml-1">({pay.note})</span>}
                          <p className="text-[10px] text-gray-400">{formatDate(pay.paidAt)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        -{formatCurrency(pay.amount, 'USD', isPrivacyMode)}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        {/* Delete Contact Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDeletePerson}
            className="w-full py-3 rounded-xl text-xs font-semibold text-ios-red bg-ios-red/10 hover:bg-ios-red/15 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete Contact & Records
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
