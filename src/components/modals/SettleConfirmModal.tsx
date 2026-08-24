import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { formatCurrency } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';

export const SettleConfirmModal: React.FC = () => {
  const { isSettleModalOpen, settleTransaction, closeSettleModal } = useAppStore();
  const person = useLiveQuery(
    () => (settleTransaction ? db.people.get(settleTransaction.personId) : undefined),
    [settleTransaction]
  );

  if (!settleTransaction) return null;

  const isLent = settleTransaction.type === 'LENT';

  const handleSettle = async () => {
    const logId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await db.paymentLogs.put({
      id: logId,
      transactionId: settleTransaction.id,
      personId: settleTransaction.personId,
      amount: settleTransaction.remainingAmount,
      paidAt: new Date().toISOString(),
      note: 'One-click full settlement',
      remainingAfterPayment: 0,
    });

    await db.transactions.update(settleTransaction.id, {
      remainingAmount: 0,
      status: 'PAID',
      updatedAt: new Date().toISOString(),
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    haptics.notificationSuccess();
    closeSettleModal();
  };

  return (
    <BottomSheet isOpen={isSettleModalOpen} onClose={closeSettleModal} title="Settle Up Debt">
      <div className="space-y-4 text-center py-2">
        <div className="w-16 h-16 rounded-full bg-ios-green/15 text-ios-green flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="w-9 h-9" />
        </div>

        <div>
          <h4 className="text-lg font-bold text-ios-text-light dark:text-ios-text-dark">
            Mark as Fully Settled?
          </h4>
          <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mt-1">
            This will record a final settlement payment of{' '}
            <span className="font-bold text-ios-text-light dark:text-ios-text-dark">
              {formatCurrency(settleTransaction.remainingAmount, settleTransaction.currency)}
            </span>{' '}
            for <span className="font-semibold">{person?.name || 'this contact'}</span>.
          </p>
        </div>

        <div className="p-3 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-xl text-xs text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-ios-text-secondaryLight">Category</span>
            <span className="font-medium">{settleTransaction.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ios-text-secondaryLight">Original Amount</span>
            <span className="font-medium">{formatCurrency(settleTransaction.amount, settleTransaction.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ios-text-secondaryLight">Remaining to Settle</span>
            <span className="font-bold text-ios-green">
              {formatCurrency(settleTransaction.remainingAmount, settleTransaction.currency)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={closeSettleModal}
            className="flex-1 py-3 rounded-2xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark font-semibold text-sm text-ios-text-light dark:text-ios-text-dark active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSettle}
            className="flex-1 py-3 rounded-2xl bg-ios-green text-white font-bold text-sm shadow-ios-glow-green active:scale-[0.98] transition-all"
          >
            Confirm Settle Up
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
