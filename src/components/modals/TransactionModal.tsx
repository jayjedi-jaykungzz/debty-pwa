import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Calendar, DollarSign, Percent, Plus, Tag, User, X } from 'lucide-react';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DebtDirection, InterestType, Transaction } from '../../types';
import { haptics } from '../../utils/haptics';

export const TransactionModal: React.FC = () => {
  const { isTransactionModalOpen, editingTransaction, closeTransactionModal, openAddPerson } = useAppStore();

  const people = useLiveQuery(() => db.people.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const [type, setType] = useState<DebtDirection>('LENT');
  const [personId, setPersonId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [interestType, setInterestType] = useState<InterestType>('NONE');
  const [interestRate, setInterestRate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [notes, setNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'LENT');
      setPersonId(editingTransaction.personId || '');
      setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
      setCurrency(editingTransaction.currency || settings?.defaultCurrency || 'USD');
      setInterestType(editingTransaction.interestType || 'NONE');
      setInterestRate(editingTransaction.interestRate ? editingTransaction.interestRate.toString() : '');
      setStartDate(
        editingTransaction.startDate
          ? editingTransaction.startDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setDueDate(editingTransaction.dueDate ? editingTransaction.dueDate.slice(0, 10) : '');
      setCategory(editingTransaction.category || 'General');
      setNotes(editingTransaction.notes || '');
      setAttachments(editingTransaction.attachments || []);
    } else {
      setType('LENT');
      setPersonId(people.length > 0 ? people[0].id : '');
      setAmount('');
      setCurrency(settings?.defaultCurrency || 'USD');
      setInterestType('NONE');
      setInterestRate('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setDueDate('');
      setCategory('General');
      setNotes('');
      setAttachments([]);
    }
    setErrorMsg('');
  }, [editingTransaction, isTransactionModalOpen, settings?.defaultCurrency]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachments((prev) => [...prev, event.target!.result as string]);
        haptics.impactLight();
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    haptics.impactLight();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      haptics.notificationError();
      return;
    }

    if (!personId) {
      setErrorMsg('Please select or add a person.');
      haptics.notificationError();
      return;
    }

    const numInterestRate = interestRate ? parseFloat(interestRate) : undefined;
    const now = new Date().toISOString();

    // Calculate total starting balance with flat or percentage interest if applicable
    let totalInitialAmount = numAmount;
    if (interestType === 'FLAT' && numInterestRate) {
      totalInitialAmount += numInterestRate;
    } else if (interestType === 'PERCENTAGE' && numInterestRate) {
      totalInitialAmount += (numAmount * numInterestRate) / 100;
    }

    const isEdit = Boolean(editingTransaction && editingTransaction.id);
    const txId = isEdit ? editingTransaction!.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Keep existing remainingAmount logic if editing, otherwise set to totalInitialAmount
    let remainingAmount = totalInitialAmount;
    if (isEdit && editingTransaction) {
      const difference = totalInitialAmount - editingTransaction.amount;
      remainingAmount = Math.max(0, editingTransaction.remainingAmount + difference);
    }

    const txData: Transaction = {
      id: txId,
      personId,
      type,
      amount: totalInitialAmount,
      remainingAmount,
      currency,
      interestType,
      interestRate: numInterestRate,
      startDate: new Date(startDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      category,
      notes: notes.trim(),
      attachments,
      status: remainingAmount <= 0 ? 'PAID' : (dueDate && new Date(dueDate) < new Date() ? 'OVERDUE' : 'ACTIVE'),
      createdAt: isEdit ? editingTransaction!.createdAt : now,
      updatedAt: now,
    };

    await db.transactions.put(txData);
    haptics.notificationSuccess();
    closeTransactionModal();
  };

  return (
    <BottomSheet
      isOpen={isTransactionModalOpen}
      onClose={closeTransactionModal}
      title={editingTransaction?.id ? 'Edit Debt Record' : 'New Debt Record'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lent vs Borrowed Switcher */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            TRANSACTION TYPE
          </label>
          <SegmentedControl
            options={[
              { value: 'LENT', label: 'I Lent (They Owe Me)' },
              { value: 'BORROWED', label: 'I Borrowed (I Owe)' },
            ]}
            value={type}
            onChange={(val) => setType(val)}
          />
        </div>

        {/* Person Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark">
              CONTACT PERSON
            </label>
            <button
              type="button"
              onClick={() => {
                haptics.impactLight();
                openAddPerson();
              }}
              className="text-xs text-ios-blue font-medium flex items-center gap-0.5 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>
          <div className="relative">
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3.5 py-3 text-sm font-medium border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue appearance-none"
            >
              <option value="" disabled>
                Select contact...
              </option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `(${p.phone})` : ''}
                </option>
              ))}
            </select>
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight pointer-events-none" />
          </div>
        </div>

        {/* Amount & Currency */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            AMOUNT & CURRENCY
          </label>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-24 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-2.5 py-3 text-sm font-bold border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue text-center"
            >
              <option value="USD">USD ($)</option>
              <option value="THB">THB (฿)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>

            <div className="relative flex-1">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl pl-8 pr-3.5 py-3 text-lg font-bold border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
              />
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
            </div>
          </div>
        </div>

        {/* Interest Option */}
        <div className="p-3 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark rounded-xl border border-black/5 dark:border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ios-text-light dark:text-ios-text-dark">
              Interest / Fee
            </span>
            <div className="flex items-center gap-1 text-xs">
              {(['NONE', 'FLAT', 'PERCENTAGE'] as InterestType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    haptics.impactLight();
                    setInterestType(t);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    interestType === t
                      ? 'bg-ios-blue text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-ios-text-secondaryLight hover:text-ios-text-light'
                  }`}
                >
                  {t === 'NONE' ? 'None' : t === 'FLAT' ? 'Flat Fee' : 'Percentage %'}
                </button>
              ))}
            </div>
          </div>

          {interestType !== 'NONE' && (
            <div className="relative pt-1">
              <input
                type="number"
                step="any"
                placeholder={interestType === 'FLAT' ? 'Fixed Fee Amount' : 'Interest Rate %'}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-white dark:bg-ios-card-dark text-ios-text-light dark:text-ios-text-dark rounded-lg px-3 py-2 text-sm font-medium border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
              />
              {interestType === 'PERCENTAGE' && (
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight pointer-events-none" />
              )}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3 py-2.5 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
              DUE DATE (OPTIONAL)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl px-3 py-2.5 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            CATEGORY TAG
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptics.impactLight();
                  setCategory(cat.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  category === cat.name
                    ? 'bg-ios-blue text-white shadow-sm'
                    : 'bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-secondaryLight dark:text-ios-text-secondaryDark hover:text-ios-text-light'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            NOTES & PURPOSE
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Dinner bill split, emergency loan, travel ticket"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl p-3 text-sm border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
          />
        </div>

        {/* Attachments (Image/Receipt) */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            RECEIPT / ATTACHMENT
          </label>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-ios-gray3 dark:border-ios-tertiaryCard-dark flex flex-col items-center justify-center text-ios-text-secondaryLight hover:text-ios-blue hover:border-ios-blue cursor-pointer transition-colors flex-shrink-0">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium">Add Photo</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {attachments.map((imgUrl, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-black/10">
                <img src={imgUrl} alt="attachment" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute top-1 right-1 w-4.5 h-4.5 bg-black/70 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-ios-red">{errorMsg}</p>
        )}

        {/* Action Button */}
        <button
          type="submit"
          className="w-full bg-ios-blue text-white rounded-2xl py-3.5 font-bold text-base shadow-ios-glow-blue active:scale-[0.98] transition-all"
        >
          {editingTransaction?.id ? 'Save Changes' : 'Record Debt'}
        </button>
      </form>
    </BottomSheet>
  );
};
