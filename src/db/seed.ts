import { db, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './db';
import { Person, Transaction, PaymentLog } from '../types';

export const SAMPLE_PEOPLE: Person[] = [
  {
    id: 'person_sarah',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@example.com',
    notes: 'Colleague from Design team',
    colorTag: '#AF52DE',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'person_michael',
    name: 'Michael Chang',
    phone: '+1 (555) 876-5432',
    email: 'michael.c@example.com',
    notes: 'College roommate, freelance dev',
    colorTag: '#007AFF',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'person_emma',
    name: 'Emma Watson',
    phone: '+1 (555) 345-6789',
    email: 'emma.w@example.com',
    notes: 'Trip organizer',
    colorTag: '#34C759',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'person_david',
    name: 'David Miller',
    phone: '+1 (555) 987-6543',
    notes: 'Neighbor',
    colorTag: '#FF9500',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'person_sophia',
    name: 'Sophia Rodriguez',
    phone: '+1 (555) 432-1098',
    colorTag: '#FF2D55',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  }
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    personId: 'person_sarah',
    type: 'LENT',
    amount: 350.00,
    remainingAmount: 150.00,
    currency: 'USD',
    transactionType: 'SINGLE',
    interestType: 'NONE',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    category: 'Travel & Trips',
    notes: 'Flight ticket booking for Tokyo trip share',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tx_2',
    personId: 'person_michael',
    type: 'LENT',
    amount: 1200.00,
    remainingAmount: 1200.00,
    currency: 'USD',
    transactionType: 'SINGLE',
    interestType: 'PERCENTAGE',
    interestRate: 5,
    interestPeriod: 'TOTAL',
    startDate: new Date(Date.now() - 25 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    category: 'Business / Loan',
    notes: 'MacBook Pro repair emergency loan',
    status: 'OVERDUE',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'tx_3',
    personId: 'person_emma',
    type: 'BORROWED',
    amount: 85.50,
    remainingAmount: 85.50,
    currency: 'USD',
    transactionType: 'SINGLE',
    interestType: 'NONE',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    category: 'Food & Dining',
    notes: 'Omakase dinner split bill at Sushi Nakazawa',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tx_4',
    personId: 'person_david',
    type: 'BORROWED',
    amount: 450.00,
    remainingAmount: 0.00,
    currency: 'USD',
    transactionType: 'SINGLE',
    interestType: 'NONE',
    startDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    category: 'Rent & Housing',
    notes: 'Apartment water damage maintenance deposit',
    status: 'PAID',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tx_5',
    personId: 'person_sophia',
    type: 'LENT',
    amount: 500.00,
    remainingAmount: 500.00,
    currency: 'USD',
    transactionType: 'SINGLE',
    interestType: 'FLAT',
    interestRate: 25,
    startDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    category: 'Shopping',
    notes: 'Camera lens purchase pre-pay',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  }
];

export const SAMPLE_PAYMENTS: PaymentLog[] = [
  {
    id: 'pay_1',
    transactionId: 'tx_1',
    personId: 'person_sarah',
    amount: 200.00,
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    note: 'Zelle transfer - 1st installment',
    remainingAfterPayment: 150.00,
  },
  {
    id: 'pay_2',
    transactionId: 'tx_4',
    personId: 'person_david',
    amount: 450.00,
    paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    note: 'Bank wire full settlement',
    remainingAfterPayment: 0.00,
  }
];

export async function seedSampleData(clearExisting = false) {
  if (clearExisting) {
    await db.transactions.clear();
    await db.people.clear();
    await db.paymentLogs.clear();
  }

  await db.people.bulkPut(SAMPLE_PEOPLE);
  await db.transactions.bulkPut(SAMPLE_TRANSACTIONS);
  await db.paymentLogs.bulkPut(SAMPLE_PAYMENTS);
  await db.categories.bulkPut(DEFAULT_CATEGORIES);
  await db.settings.put(DEFAULT_SETTINGS);
}
