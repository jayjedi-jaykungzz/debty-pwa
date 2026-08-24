import { db } from '../db/db';
import { Person, Transaction, PaymentLog, AppSettings, CategoryItem } from '../types';

export interface BackupData {
  version: number;
  exportedAt: string;
  people: Person[];
  transactions: Transaction[];
  paymentLogs: PaymentLog[];
  categories: CategoryItem[];
  settings: AppSettings[];
}

export async function exportDatabaseToJSON(): Promise<void> {
  const [people, transactions, paymentLogs, categories, settings] = await Promise.all([
    db.people.toArray(),
    db.transactions.toArray(),
    db.paymentLogs.toArray(),
    db.categories.toArray(),
    db.settings.toArray(),
  ]);

  const backupData: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    people,
    transactions,
    paymentLogs,
    categories,
    settings,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(backupData, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute(
    'download',
    `debty_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function importDatabaseFromJSON(jsonText: string): Promise<boolean> {
  try {
    const data: BackupData = JSON.parse(jsonText);
    if (!data.people || !data.transactions) {
      throw new Error('Invalid backup format');
    }

    await db.transaction('rw', [db.people, db.transactions, db.paymentLogs, db.categories, db.settings], async () => {
      await db.people.clear();
      await db.transactions.clear();
      await db.paymentLogs.clear();
      await db.categories.clear();
      await db.settings.clear();

      if (data.people.length > 0) await db.people.bulkPut(data.people);
      if (data.transactions.length > 0) await db.transactions.bulkPut(data.transactions);
      if (data.paymentLogs && data.paymentLogs.length > 0) await db.paymentLogs.bulkPut(data.paymentLogs);
      if (data.categories && data.categories.length > 0) await db.categories.bulkPut(data.categories);
      if (data.settings && data.settings.length > 0) await db.settings.bulkPut(data.settings);
    });

    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

export async function exportTransactionsToCSV(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const people = await db.people.toArray();
  const peopleMap = new Map(people.map((p) => [p.id, p.name]));

  const headers = [
    'ID',
    'Contact Name',
    'Direction',
    'Amount',
    'Remaining Balance',
    'Currency',
    'Status',
    'Category',
    'Interest Type',
    'Interest Rate',
    'Start Date',
    'Due Date',
    'Notes',
    'Created At',
  ];

  const rows = transactions.map((t) => [
    t.id,
    `"${peopleMap.get(t.personId) || 'Unknown'}"`,
    t.type,
    t.amount,
    t.remainingAmount,
    t.currency,
    t.status,
    `"${t.category || ''}"`,
    t.interestType,
    t.interestRate || 0,
    t.startDate || '',
    t.dueDate || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.createdAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `debty_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
