import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Lock,
  Fingerprint,
  Moon,
  Sun,
  Globe,
  Sparkles,
  Trash2,
  Share2,
  Check,
  Shield,
  Smartphone,
} from 'lucide-react';
import { db, DEFAULT_SETTINGS } from '../db/db';
import { seedSampleData } from '../db/seed';
import { useAppStore } from '../store/useAppStore';
import { TopNavBar } from '../components/layout/TopNavBar';
import { exportDatabaseToJSON, importDatabaseFromJSON, exportTransactionsToCSV } from '../utils/export';
import { haptics } from '../utils/haptics';

export const SettingsView: React.FC = () => {
  const { lockApp } = useAppStore();
  const settings = useLiveQuery(() => db.settings.get('app_settings')) || DEFAULT_SETTINGS;

  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [showPinEdit, setShowPinEdit] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateSettings = async (partial: Partial<typeof settings>) => {
    haptics.impactLight();
    await db.settings.put({
      ...settings,
      ...partial,
    });
  };

  const handleSavePin = async () => {
    if (pinInput.length !== 4) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    await handleUpdateSettings({ pinCode: pinInput, isPinEnabled: true });
    setShowPinEdit(false);
    haptics.notificationSuccess();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = await importDatabaseFromJSON(text);
        if (success) {
          haptics.notificationSuccess();
          alert('Database successfully restored!');
        } else {
          haptics.notificationError();
          alert('Failed to import database file. Please ensure it is a valid Debty JSON backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (confirm('⚠️ CAUTION: Are you sure you want to delete all transactions, contacts, and payment logs? This cannot be undone.')) {
      haptics.impactHeavy();
      await db.transactions.clear();
      await db.people.clear();
      await db.paymentLogs.clear();
      haptics.notificationSuccess();
      alert('All local database records cleared.');
    }
  };

  return (
    <div className="min-h-screen pb-tab-safe">
      <TopNavBar title="Settings" subtitle="Preferences, Backup & Security" showAdd={false} />

      <main className="px-5 py-3 space-y-5">
        {/* Currency & Locale */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark px-1">
            Currency & Region
          </label>
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-ios-blue" />
                <div>
                  <h4 className="text-sm font-semibold text-ios-text-light dark:text-ios-text-dark">
                    Default Currency
                  </h4>
                  <p className="text-xs text-ios-text-secondaryLight">Used across reports and cards</p>
                </div>
              </div>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleUpdateSettings({ defaultCurrency: e.target.value })}
                className="bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark font-bold text-xs rounded-xl px-3 py-2 border border-black/5 dark:border-white/10 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="THB">THB (฿)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & App Lock */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark px-1">
            Privacy & Security
          </label>
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-4">
            {/* PIN Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-ios-blue" />
                <div>
                  <h4 className="text-sm font-semibold text-ios-text-light dark:text-ios-text-dark">
                    4-Digit Passcode Lock
                  </h4>
                  <p className="text-xs text-ios-text-secondaryLight">Require PIN to open app</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.isPinEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  handleUpdateSettings({ isPinEnabled: enabled });
                  if (enabled && !settings.pinCode) {
                    setShowPinEdit(true);
                  }
                }}
                className="w-5 h-5 accent-ios-blue cursor-pointer"
              />
            </div>

            {/* PIN Editor */}
            {settings.isPinEnabled && (
              <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-ios-text-secondaryLight font-medium">
                  Current PIN: <strong className="text-ios-text-light dark:text-ios-text-dark">{settings.pinCode || '1234'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinEdit(!showPinEdit)}
                  className="text-xs text-ios-blue font-semibold hover:underline"
                >
                  {showPinEdit ? 'Cancel' : 'Change PIN'}
                </button>
              </div>
            )}

            {showPinEdit && (
              <div className="flex gap-2 pt-1">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="4 digits"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark text-center font-mono font-bold tracking-widest text-sm rounded-xl px-3 py-2 border border-black/5 dark:border-white/10 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSavePin}
                  className="px-4 py-2 rounded-xl bg-ios-blue text-white text-xs font-bold shadow-sm"
                >
                  Save PIN
                </button>
              </div>
            )}

            {/* Biometric Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-5 h-5 text-ios-purple" />
                <div>
                  <h4 className="text-sm font-semibold text-ios-text-light dark:text-ios-text-dark">
                    Biometric Unlock
                  </h4>
                  <p className="text-xs text-ios-text-secondaryLight">Face ID / Touch ID simulation</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.biometricEnabled}
                onChange={(e) => handleUpdateSettings({ biometricEnabled: e.target.checked })}
                className="w-5 h-5 accent-ios-purple cursor-pointer"
              />
            </div>

            {/* Lock Now Action */}
            {settings.isPinEnabled && (
              <button
                type="button"
                onClick={() => {
                  haptics.impactMedium();
                  lockApp();
                }}
                className="w-full py-2.5 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-xs font-bold text-ios-text-light dark:text-ios-text-dark flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4" /> Lock App Now
              </button>
            )}
          </div>
        </div>

        {/* Data Backup & Export */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark px-1">
            Data Management & Offline Backup
          </label>
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-2.5">
            {/* Export JSON */}
            <button
              type="button"
              onClick={() => {
                haptics.impactLight();
                exportDatabaseToJSON();
              }}
              className="w-full py-3 px-3.5 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark flex items-center justify-between text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4.5 h-4.5 text-ios-blue" />
                <span>Export Full Backup (JSON)</span>
              </div>
              <span className="text-[10px] text-ios-text-secondaryLight">Save offline file</span>
            </button>

            {/* Import JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-3.5 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark flex items-center justify-between text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-4.5 h-4.5 text-ios-green" />
                <span>Restore from Backup (JSON)</span>
              </div>
              <span className="text-[10px] text-ios-text-secondaryLight">Load file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* Export CSV */}
            <button
              type="button"
              onClick={() => {
                haptics.impactLight();
                exportTransactionsToCSV();
              }}
              className="w-full py-3 px-3.5 rounded-xl bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark flex items-center justify-between text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4.5 h-4.5 text-ios-orange" />
                <span>Export CSV Spreadsheet</span>
              </div>
              <span className="text-[10px] text-ios-text-secondaryLight">Excel / Numbers</span>
            </button>
          </div>
        </div>

        {/* Realistic Demo Data & Reset */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ios-text-secondaryLight dark:text-ios-text-secondaryDark px-1">
            Sample Data & Maintenance
          </label>
          <div className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-ios-card space-y-2.5">
            <button
              type="button"
              onClick={async () => {
                haptics.impactMedium();
                await seedSampleData(false);
                haptics.notificationSuccess();
                alert('Realistic sample contacts and transactions loaded!');
              }}
              className="w-full py-3 px-3.5 rounded-xl bg-ios-blue text-white flex items-center justify-center gap-2 text-xs font-bold shadow-ios-glow-blue active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Load Realistic Sample Data
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="w-full py-3 px-3.5 rounded-xl bg-ios-red/10 text-ios-red flex items-center justify-center gap-2 text-xs font-bold hover:bg-ios-red/15 active:scale-98 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Erase All App Data
            </button>
          </div>
        </div>

        {/* PWA Safari Info Card */}
        <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs text-ios-text-light dark:text-ios-text-dark space-y-2">
          <div className="flex items-center gap-2 text-ios-blue font-bold">
            <Smartphone className="w-4.5 h-4.5" />
            <span>Install as Native App on iPhone (Safari PWA)</span>
          </div>
          <p className="text-[11px] text-ios-text-secondaryLight leading-relaxed">
            1. Open this URL in <strong>Safari</strong> on iOS.<br />
            2. Tap the <strong>Share</strong> icon (square with arrow up).<br />
            3. Tap <strong>"Add to Home Screen"</strong> for full-screen native experience with zero address bar!
          </p>
        </div>
      </main>
    </div>
  );
};
