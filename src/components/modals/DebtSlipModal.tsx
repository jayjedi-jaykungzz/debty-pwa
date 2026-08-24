import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import html2canvas from 'html2canvas';
import { Download, Share2, Copy, Check, QrCode } from 'lucide-react';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';

export const DebtSlipModal: React.FC = () => {
  const { isSlipModalOpen, slipTransaction, closeSlipModal } = useAppStore();
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const person = useLiveQuery(
    () => (slipTransaction ? db.people.get(slipTransaction.personId) : undefined),
    [slipTransaction]
  );
  const paymentLogs = useLiveQuery(
    () =>
      slipTransaction
        ? db.paymentLogs.where('transactionId').equals(slipTransaction.id).toArray()
        : [],
    [slipTransaction]
  ) || [];

  if (!slipTransaction) return null;

  const isLent = slipTransaction.type === 'LENT';

  const generateImage = async (): Promise<string | null> => {
    if (!slipRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Failed to generate slip canvas:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    haptics.impactMedium();
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `debty-receipt-${person?.name || 'slip'}-${Date.now().toString().slice(-4)}.png`;
    link.href = dataUrl;
    link.click();
    haptics.notificationSuccess();
  };

  const handleShare = async () => {
    haptics.impactMedium();
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'debt-slip.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Debty Debt Summary - ${person?.name || ''}`,
          text: `Here is the debt summary slip for ${formatCurrency(slipTransaction.remainingAmount, slipTransaction.currency)}.`,
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const handleCopySummary = () => {
    haptics.impactLight();
    const text = `📋 *DEBTY DEBT SUMMARY*\n` +
      `👤 Contact: ${person?.name || 'Friend'}\n` +
      `🏷️ Type: ${isLent ? 'I Lent to You (Receivable)' : 'I Borrowed (Payable)'}\n` +
      `💰 Remaining Balance: ${formatCurrency(slipTransaction.remainingAmount, slipTransaction.currency)}\n` +
      `🗓️ Issue Date: ${formatDate(slipTransaction.startDate)}\n` +
      (slipTransaction.dueDate ? `⏰ Due Date: ${formatDate(slipTransaction.dueDate)}\n` : '') +
      (slipTransaction.notes ? `📝 Note: ${slipTransaction.notes}\n` : '') +
      `✨ Tracked with Debty App`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    haptics.notificationSuccess();
  };

  return (
    <BottomSheet isOpen={isSlipModalOpen} onClose={closeSlipModal} title="Shareable Debt Slip">
      <div className="space-y-4">
        {/* Printable Slip Preview Container */}
        <div className="flex justify-center p-2">
          <div
            ref={slipRef}
            className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 relative overflow-hidden"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {/* Top Badge Decorator */}
            <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base">
                  D
                </div>
                <div>
                  <h4 className="font-extrabold text-base tracking-tight text-gray-900 leading-none">
                    Debty Receipt
                  </h4>
                  <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                    Private Debt Slip
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                    slipTransaction.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-700'
                      : isLent
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {slipTransaction.status === 'PAID' ? 'PAID & SETTLED' : isLent ? 'RECEIVABLE' : 'PAYABLE'}
                </span>
              </div>
            </div>

            {/* Central Amount Display */}
            <div className="text-center py-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {slipTransaction.status === 'PAID' ? 'Total Settled Amount' : 'Outstanding Balance'}
              </p>
              <h2 className="text-3xl font-black text-gray-950 tracking-tight">
                {formatCurrency(
                  slipTransaction.status === 'PAID' ? slipTransaction.amount : slipTransaction.remainingAmount,
                  slipTransaction.currency
                )}
              </h2>
              {slipTransaction.remainingAmount < slipTransaction.amount && slipTransaction.status !== 'PAID' && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Original: {formatCurrency(slipTransaction.amount, slipTransaction.currency)} (
                  {formatCurrency(slipTransaction.amount - slipTransaction.remainingAmount, slipTransaction.currency)} paid)
                </p>
              )}
            </div>

            {/* Breakdown Table */}
            <div className="space-y-2.5 text-xs border-t border-b border-dashed border-gray-300 py-4 text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Contact</span>
                <span className="font-bold text-gray-900">{person?.name || 'Contact'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Direction</span>
                <span className="font-semibold">{isLent ? 'Money Owed to You' : 'Money You Owe'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-semibold">{slipTransaction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Issue Date</span>
                <span>{formatDate(slipTransaction.startDate)}</span>
              </div>
              {slipTransaction.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-semibold text-rose-600">{formatDate(slipTransaction.dueDate)}</span>
                </div>
              )}
              {slipTransaction.notes && (
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Memo</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{slipTransaction.notes}</span>
                </div>
              )}
            </div>

            {/* Payment history mini list if any */}
            {paymentLogs.length > 0 && (
              <div className="py-3 border-b border-dashed border-gray-300 text-xs">
                <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">
                  Payment History
                </p>
                {paymentLogs.map((log) => (
                  <div key={log.id} className="flex justify-between text-[11px] text-gray-600 py-0.5">
                    <span>{formatDate(log.paidAt, 'MMM d')} - {log.note || 'Payment'}</span>
                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(log.amount, slipTransaction.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer stamp */}
            <div className="flex items-center justify-between pt-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <QrCode className="w-5 h-5 text-gray-400" />
                <span>Verified Private Record</span>
              </div>
              <span className="italic">Debty Mobile PWA</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-ios-blue text-white font-bold text-xs shadow-ios-glow-blue active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share Slip
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark font-bold text-xs text-ios-text-light dark:text-ios-text-dark active:scale-95 transition-all border border-black/5 dark:border-white/10"
          >
            <Download className="w-4 h-4" />
            Save PNG
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark font-bold text-xs text-ios-text-light dark:text-ios-text-dark active:scale-95 transition-all border border-black/5 dark:border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-ios-green" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
