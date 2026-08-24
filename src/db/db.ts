import Dexie, { type Table } from 'dexie';
import { Person, Transaction, PaymentLog, CategoryItem, AppSettings } from '../types';

export class DebtyDatabase extends Dexie {
  people!: Table<Person, string>;
  transactions!: Table<Transaction, string>;
  paymentLogs!: Table<PaymentLog, string>;
  categories!: Table<CategoryItem, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('DebtyDatabase');
    this.version(1).stores({
      people: 'id, name, phone, createdAt',
      transactions: 'id, personId, type, status, category, currency, startDate, dueDate, createdAt',
      paymentLogs: 'id, transactionId, personId, paidAt',
      categories: 'id, name',
      settings: 'id'
    });
  }
}

export const db = new DebtyDatabase();

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  defaultCurrency: 'USD',
  isPinEnabled: false,
  biometricEnabled: false,
  isPrivacyMode: false,
  theme: 'system',
  userName: 'Alex Carter',
  enableSound: true,
  autoLockMinutes: 5,
};

// Default categories
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat_general', name: 'General', icon: 'Wallet', color: '#007AFF' },
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#FF9500' },
  { id: 'cat_travel', name: 'Travel & Trips', icon: 'Plane', color: '#5856D6' },
  { id: 'cat_rent', name: 'Rent & Housing', icon: 'Home', color: '#34C759' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#FF2D55' },
  { id: 'cat_business', name: 'Business / Loan', icon: 'Briefcase', color: '#AF52DE' },
  { id: 'cat_utilities', name: 'Bills & Utilities', icon: 'Zap', color: '#5AC8FA' },
  { id: 'cat_family', name: 'Friends & Family', icon: 'Heart', color: '#FF3B30' },
];

export async function initDatabaseDefaults() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}
