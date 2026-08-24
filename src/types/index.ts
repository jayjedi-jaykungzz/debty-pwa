export type DebtDirection = 'LENT' | 'BORROWED'; // LENT = I Lent (Receivable), BORROWED = I Borrowed (Payable)
export type DebtStatus = 'ACTIVE' | 'PAID' | 'OVERDUE';
export type InterestType = 'NONE' | 'FLAT' | 'PERCENTAGE';
export type TransactionType = 'SINGLE' | 'INSTALLMENT' | 'RECURRING';

export interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  notes?: string;
  colorTag?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  personId: string;
  type: DebtDirection;
  amount: number;
  remainingAmount: number;
  currency: string;
  transactionType?: TransactionType;
  interestType: InterestType;
  interestRate?: number; // Flat value or percentage
  interestPeriod?: 'MONTHLY' | 'YEARLY' | 'TOTAL';
  startDate: string;
  dueDate?: string;
  category: string;
  notes?: string;
  attachments?: string[]; // Base64 data URLs
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLog {
  id: string;
  transactionId: string;
  personId: string;
  amount: number;
  paidAt: string;
  note?: string;
  receiptImage?: string;
  remainingAfterPayment: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AppSettings {
  id: string;
  defaultCurrency: string;
  pinCode?: string;
  isPinEnabled: boolean;
  biometricEnabled: boolean;
  isPrivacyMode: boolean;
  theme: 'system' | 'light' | 'dark';
  userName: string;
  userAvatar?: string;
  enableSound: boolean;
  autoLockMinutes: number;
}

export type TabType = 'dashboard' | 'transactions' | 'people' | 'analytics' | 'settings';
