import { create } from 'zustand';
import { TabType, DebtDirection, DebtStatus, Transaction, Person } from '../types';

interface FilterState {
  searchQuery: string;
  direction?: DebtDirection;
  status?: DebtStatus | 'ALL';
  category?: string;
  personId?: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'due_date';
}

interface AppState {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Privacy Mode (blurs balances)
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (val: boolean) => void;

  // Security / PIN
  isLocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;

  // Modals & Sheets
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openAddTransaction: (defaultType?: DebtDirection, defaultPersonId?: string) => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTransactionModal: () => void;

  isRepayModalOpen: boolean;
  repayTransaction: Transaction | null;
  openRepayModal: (tx: Transaction) => void;
  closeRepayModal: () => void;

  isSettleModalOpen: boolean;
  settleTransaction: Transaction | null;
  openSettleModal: (tx: Transaction) => void;
  closeSettleModal: () => void;

  isSlipModalOpen: boolean;
  slipTransaction: Transaction | null;
  openSlipModal: (tx: Transaction) => void;
  closeSlipModal: () => void;

  isPersonModalOpen: boolean;
  editingPerson: Person | null;
  openAddPerson: () => void;
  openEditPerson: (p: Person) => void;
  closePersonModal: () => void;

  isPersonDetailOpen: boolean;
  selectedPersonId: string | null;
  openPersonDetail: (personId: string) => void;
  closePersonDetail: () => void;

  isFilterSheetOpen: boolean;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;

  // Global filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isPrivacyMode: false,
  togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
  setPrivacyMode: (val) => set({ isPrivacyMode: val }),

  isLocked: false,
  unlockApp: () => set({ isLocked: false }),
  lockApp: () => set({ isLocked: true }),

  // Transaction Modal
  isTransactionModalOpen: false,
  editingTransaction: null,
  openAddTransaction: (defaultType, defaultPersonId) =>
    set({
      isTransactionModalOpen: true,
      editingTransaction: defaultType
        ? ({
            id: '',
            personId: defaultPersonId || '',
            type: defaultType,
            amount: 0,
            remainingAmount: 0,
            currency: 'USD',
            interestType: 'NONE',
            startDate: new Date().toISOString(),
            category: 'General',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Transaction)
        : null,
    }),
  openEditTransaction: (tx) =>
    set({
      isTransactionModalOpen: true,
      editingTransaction: tx,
    }),
  closeTransactionModal: () =>
    set({
      isTransactionModalOpen: false,
      editingTransaction: null,
    }),

  // Repay Modal
  isRepayModalOpen: false,
  repayTransaction: null,
  openRepayModal: (tx) => set({ isRepayModalOpen: true, repayTransaction: tx }),
  closeRepayModal: () => set({ isRepayModalOpen: false, repayTransaction: null }),

  // Settle Modal
  isSettleModalOpen: false,
  settleTransaction: null,
  openSettleModal: (tx) => set({ isSettleModalOpen: true, settleTransaction: tx }),
  closeSettleModal: () => set({ isSettleModalOpen: false, settleTransaction: null }),

  // Slip Modal
  isSlipModalOpen: false,
  slipTransaction: null,
  openSlipModal: (tx) => set({ isSlipModalOpen: true, slipTransaction: tx }),
  closeSlipModal: () => set({ isSlipModalOpen: false, slipTransaction: null }),

  // Person Modal
  isPersonModalOpen: false,
  editingPerson: null,
  openAddPerson: () => set({ isPersonModalOpen: true, editingPerson: null }),
  openEditPerson: (p) => set({ isPersonModalOpen: true, editingPerson: p }),
  closePersonModal: () => set({ isPersonModalOpen: false, editingPerson: null }),

  // Person Detail Sheet
  isPersonDetailOpen: false,
  selectedPersonId: null,
  openPersonDetail: (personId) => set({ isPersonDetailOpen: true, selectedPersonId: personId }),
  closePersonDetail: () => set({ isPersonDetailOpen: false, selectedPersonId: null }),

  // Filter Sheet
  isFilterSheetOpen: false,
  openFilterSheet: () => set({ isFilterSheetOpen: true }),
  closeFilterSheet: () => set({ isFilterSheetOpen: false }),

  // Filters
  filters: {
    searchQuery: '',
    status: 'ALL',
    sortBy: 'date_desc',
  },
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () =>
    set({
      filters: {
        searchQuery: '',
        status: 'ALL',
        sortBy: 'date_desc',
      },
    }),
}));
