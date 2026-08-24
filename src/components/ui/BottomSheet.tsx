import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showClose?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh]',
  showClose = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      haptics.impactLight();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              haptics.impactLight();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`relative w-full max-w-lg bg-ios-card-light dark:bg-ios-card-dark rounded-t-[28px] shadow-2xl flex flex-col ${maxHeight} z-10 border-t border-black/5 dark:border-white/10 overflow-hidden pb-safe`}
          >
            {/* Drag Pill Handle */}
            <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.2 rounded-full bg-ios-gray3 dark:bg-ios-tertiaryCard-dark" />
            </div>

            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-black/5 dark:border-white/5">
                <h3 className="text-lg font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                  {title}
                </h3>
                {showClose && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.impactLight();
                      onClose();
                    }}
                    className="w-8 h-8 rounded-full bg-ios-tertiaryCard-light dark:bg-ios-secondaryCard-dark flex items-center justify-center text-ios-text-secondaryLight dark:text-ios-text-secondaryDark hover:text-ios-text-light dark:hover:text-ios-text-dark transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
