# Debty - Private Debt Tracker (iOS-Native PWA)

A mobile-first, privacy-focused Web Application (Optimized for iPhone / Safari PWA) that replicates the core and advanced features of the iOS **"Debty: Private Debt Tracker"** app.

---

## 📱 Features

- **iOS Cupertino UI/UX:** Translucent blur bars (`backdrop-blur-md`), SF Pro typography, safe area support (`env(safe-area-inset-*)`), and native iOS gestures (swipe-to-action & bottom sheet drag-to-dismiss).
- **100% Offline & Local-First:** Built on IndexedDB (`Dexie.js`). No mandatory cloud login required; data stays on your device.
- **Two Core Categories:** `I Lent` (Money owed to you) vs `I Borrowed` (Money you owe).
- **Multi-Currency & Interest Support:** Multi-currency formatting (THB ฿, USD $, EUR €, JPY ¥, etc.) and interest fee calculation (Flat fee or Simple %).
- **Repayments & Ledger:** Partial repayment logs, 1-click "Settle Up" with confetti celebration, and comprehensive per-contact timeline ledgers.
- **Shareable Debt Slips:** Instant high-definition receipt slip generator (`html2canvas`) ready to share via LINE, WhatsApp, or iMessage.
- **Analytics & Insights:** Net position hero balance, debt-to-credit ratio gauge, 30-day cashflow forecast, and top debtors/creditors.
- **Privacy & Security:** One-tap Privacy Mode (blurs balances on screen) and 4-digit PIN Passcode screen with biometric Face ID / Touch ID simulation.
- **Backup & Restore:** 1-click JSON database export/import and CSV spreadsheet download.

---

## 🛠 Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (iOS System Palette & Tokens)
- **Persistence:** Dexie.js (IndexedDB)
- **State Management:** Zustand
- **Animations:** Framer Motion & canvas-confetti
- **Receipts:** html2canvas
- **Icons:** Lucide React

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 📲 Install on iOS (iPhone / Safari PWA)

1. Open the deployed URL in **Safari** on iOS.
2. Tap the **Share button** (square with arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Enjoy a full-screen, standalone app experience with zero browser address bar!
