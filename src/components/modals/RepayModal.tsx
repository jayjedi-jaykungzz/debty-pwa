import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { formatCurrency } from '../../utils/formatters';
import { PaymentLog } from '../../types';
import { haptics } from '../../utils/haptics';

export const RepayModal: React.FC = () => {
  const { isRepayModalOpen, repayTransaction, closeRepayModal } = useAppStore();
  const person = useLiveQuery(
    () => (repayTransaction ? db.people.get(repayTransaction.personId) : undefined),
    [repayTransaction]
  );

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (repayTransaction) {
      setPaymentAmount(repayTransaction.remainingAmount.toString());
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setErrorMsg('');
    }
  }, [repayTransaction, isRepayModalOpen]);

  if (!repayTransaction) return null;

  const numPayment = parseFloat(paymentAmount) || 0;
  const remainingAfter = Math.max(0, repayTransaction.remainingAmount - numPayment);
  const isFullSettlement = remainingAfter === 0 && numPayment > 0;

  const handleQuickPercent = (pct: number) => {
    haptics.impactLight();
    const val = (repayTransaction.remainingAmount * pct) / 100;
    setPaymentAmount(val.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numPayment <= 0) {
      setErrorMsg('Payment amount must be greater than 0.');
      haptics.notificationError();
      return;
    }

    if (numPayment > repayTransaction.remainingAmount) {
      setErrorMsg(`Amount cannot exceed remaining balance of ${formatCurrency(repayTransaction.remainingAmount, repayTransaction.currency)}`);
      haptics.notificationError();
      return;
    }

    const logId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newLog: PaymentLog = {
      id: logId,
      transactionId: repayTransaction.id,
      personId: repayTransaction.personId,
      amount: numPayment,
      paidAt: new Date(paymentDate).toISOString(),
      note: note.trim() || undefined,
      remainingAfterPayment: remainingAfter,
    };

    await db.paymentLogs.put(newLog);

    // Update Transaction record
    await db.transactions.update(repayTransaction.id, {
      remainingAmount: remainingAfter,
      status: remainingAfter === 0 ? 'PAID' : 'ACTIVE',
      updatedAt: new Date().toISOString(),
    });

    if (isFullSettlement) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      haptics.notificationSuccess();
    } else {
      haptics.notificationSuccess();
    }

    closeRepayModal();
  };

  const isLent = repayTransaction.type === 'LENT';

  return (
    <BottomSheet
      isOpen={isRepayModalOpen}
      onClose={closeRepayModal}
      title={isLent ? 'Record Received Payment' : 'Record Debt Repayment'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info summary card */}
        <div className="p-3.5 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
              {isLent ? 'Payment from' : 'Payment to'}
            </p>
            <p className="text-base font-bold text-ios-text-light dark:text-ios-text-dark">
              {person?.name || 'Contact'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
              Current Remaining
            </p>
            <p className="text-base font-bold text-ios-blue">
              {formatCurrency(repayTransaction.remainingAmount, repayTransaction.currency)}
            </p>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            PAYMENT AMOUNT
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-2xl pl-9 pr-4 py-3.5 text-2xl font-black border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ios-text-secondaryLight" />
          </div>

          {/* Quick Percent Pills */}
          <div className="flex items-center gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight dark:text-ios-text-secondaryDark hover:text-ios-blue hover:bg-ios-blue/10 transition-colors"
              >
                {pct === 100 ? 'Full' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Balance After Payment Preview */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-medium">
          <span className="text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
            Remaining balance after payment:
          </span>
          <span className={`font-bold ${isFullSettlement ? 'text-ios-green' : 'text-ios-text-light dark:text-ios-text-dark'}`}>
            {formatCurrency(remainingAfter, repayTransaction.currency)}
            {isFullSettlement && ' (Settled!)'}
          </span>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            PAYMENT DATE
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3.5 py-3 text-sm font-medium border border-black/5 dark:border-white/10 focus:outline-none"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            PAYMENT NOTE (OPTIONAL)
          </label>
          <input
            type="text"
            placeholder="e.g. Bank transfer, Cash in person, PromptPay"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3.5 py-3 text-sm border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
          />
        </div>

        {errorMsg && <p className="text-xs font-medium text-ios-red">{errorMsg}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-ios-blue text-white rounded-2xl py-3.5 font-bold text-base shadow-ios-glow-blue active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          {isFullSettlement ? 'Complete Full Settlement' : 'Confirm Partial Payment'}
        </button>
      </form>
    </BottomSheet>
  );
};
