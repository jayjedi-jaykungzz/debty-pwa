import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  THB: '฿',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
};

export function formatCurrency(amount: number, currencyCode: string = 'USD', privacyMode: boolean = false): string {
  if (privacyMode) {
    return '••••••';
  }

  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode + ' ';
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `${symbol}${formattedNumber}`;
}

export function formatRelativeDueDate(dueDateStr?: string): { text: string; isOverdue: boolean; isDueSoon: boolean } {
  if (!dueDateStr) {
    return { text: 'No due date', isOverdue: false, isDueSoon: false };
  }

  try {
    const dueDate = parseISO(dueDateStr);
    const now = new Date();

    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        text: `Overdue (${formatDistanceToNow(dueDate, { addSuffix: true })})`,
        isOverdue: true,
        isDueSoon: false,
      };
    }

    if (isToday(dueDate)) {
      return { text: 'Due today', isOverdue: false, isDueSoon: true };
    }

    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', isOverdue: false, isDueSoon: true };
    }

    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return {
        text: `Due in ${diffDays} days`,
        isOverdue: false,
        isDueSoon: true,
      };
    }

    return {
      text: `Due ${format(dueDate, 'MMM d, yyyy')}`,
      isOverdue: false,
      isDueSoon: false,
    };
  } catch {
    return { text: dueDateStr, isOverdue: false, isDueSoon: false };
  }
}

export function formatDate(dateStr: string, formatPattern: string = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), formatPattern);
  } catch {
    return dateStr;
  }
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
