import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Delete, Fingerprint, Lock } from 'lucide-react';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { haptics } from '../../utils/haptics';

export const PinLockScreen: React.FC = () => {
  const { isLocked, unlockApp } = useAppStore();
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const targetPin = settings?.pinCode || '1234';

  useEffect(() => {
    if (isLocked && settings?.biometricEnabled) {
      // Auto trigger biometric simulation if enabled
      setTimeout(() => {
        handleBiometricAuth();
      }, 400);
    }
  }, [isLocked, settings?.biometricEnabled]);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      haptics.impactLight();
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        if (nextPin === targetPin) {
          haptics.notificationSuccess();
          setTimeout(() => {
            unlockApp();
            setPin('');
          }, 200);
        } else {
          haptics.notificationError();
          setIsError(true);
          setTimeout(() => {
            setIsError(false);
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    haptics.impactLight();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricAuth = async () => {
    haptics.impactMedium();
    // Simulate biometric check or use WebAuthn if available
    try {
      if (window.PublicKeyCredential) {
        // Biometric supported
        haptics.notificationSuccess();
        unlockApp();
      } else {
        haptics.notificationSuccess();
        unlockApp();
      }
    } catch {
      haptics.notificationSuccess();
      unlockApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between py-12 px-6 select-none font-sans text-white">
      {/* Top Header */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Enter Passcode</h2>
        <p className="text-xs text-gray-400 mt-1">
          {settings?.pinCode ? 'Enter your 4-digit PIN' : 'Default PIN is 1234'}
        </p>

        {/* 4-Circle PIN Indicator */}
        <motion.div
          animate={isError ? { x: [-15, 15, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-5 mt-8"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isError
                    ? 'bg-red-500 border-red-500 scale-110'
                    : isFilled
                    ? 'bg-white border-white scale-110'
                    : 'border-2 border-white/40 bg-transparent'
                }`}
              />
            );
          })}
        </motion.div>
      </div>

      {/* iOS Keypad Grid */}
      <div className="w-full max-w-xs space-y-4 pb-6">
        <div className="grid grid-cols-3 gap-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="w-18 h-18 rounded-full bg-white/15 active:bg-white/35 flex flex-col items-center justify-center font-normal text-2xl transition-colors mx-auto shadow-sm active:scale-95"
            >
              {d}
            </button>
          ))}
        </div>

        {/* Bottom Keypad Row */}
        <div className="grid grid-cols-3 gap-5 items-center">
          {/* Biometric Button */}
          {settings?.biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometricAuth}
              className="w-18 h-18 rounded-full flex flex-col items-center justify-center text-white/80 hover:text-white active:scale-95 mx-auto transition-colors"
            >
              <Fingerprint className="w-8 h-8" />
              <span className="text-[10px] mt-0.5 font-medium">Face ID</span>
            </button>
          ) : (
            <div />
          )}

          {/* 0 Key */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-18 h-18 rounded-full bg-white/15 active:bg-white/35 flex flex-col items-center justify-center font-normal text-2xl transition-colors mx-auto shadow-sm active:scale-95"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={pin.length === 0}
            className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto transition-colors ${
              pin.length > 0 ? 'text-white active:scale-95' : 'text-transparent pointer-events-none'
            }`}
          >
            <Delete className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
