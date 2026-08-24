import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { CheckCircle, DollarSign, Share2, Trash2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface SwipeableCardProps {
  children: React.ReactNode;
  onRepay?: () => void;
  onSettle?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  isPaid?: boolean;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onRepay,
  onSettle,
  onShare,
  onDelete,
  isPaid = false,
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);

  // Maximum swipe left distance based on available actions
  const actionCount = (onRepay && !isPaid ? 1 : 0) + (onSettle && !isPaid ? 1 : 0) + (onShare ? 1 : 0) + (onDelete ? 1 : 0);
  const maxSwipe = -65 * Math.max(1, actionCount);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) {
      setOffsetX(maxSwipe);
      haptics.impactLight();
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3 select-none">
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 flex items-stretch bg-ios-tertiaryCard-light dark:bg-ios-tertiaryCard-dark">
        {onRepay && !isPaid && (
          <button
            type="button"
            onClick={() => {
              haptics.impactMedium();
              setOffsetX(0);
              onRepay();
            }}
            className="w-16 bg-ios-blue text-white flex flex-col items-center justify-center gap-1 active:opacity-80 transition-opacity"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Repay</span>
          </button>
        )}

        {onSettle && !isPaid && (
          <button
            type="button"
            onClick={() => {
              haptics.impactMedium();
              setOffsetX(0);
              onSettle();
            }}
            className="w-16 bg-ios-green text-white flex flex-col items-center justify-center gap-1 active:opacity-80 transition-opacity"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Settle</span>
          </button>
        )}

        {onShare && (
          <button
            type="button"
            onClick={() => {
              haptics.impactLight();
              setOffsetX(0);
              onShare();
            }}
            className="w-16 bg-ios-purple text-white flex flex-col items-center justify-center gap-1 active:opacity-80 transition-opacity"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Slip</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              haptics.impactHeavy();
              setOffsetX(0);
              onDelete();
            }}
            className="w-16 bg-ios-red text-white flex flex-col items-center justify-center gap-1 active:opacity-80 transition-opacity"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        )}
      </div>

      {/* Foreground Swipeable Content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: maxSwipe, right: 0 }}
        dragElastic={0.1}
        animate={{ x: offsetX }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (offsetX !== 0) {
            setOffsetX(0);
          }
        }}
        className="relative z-10 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl shadow-ios-card border border-black/5 dark:border-white/5 cursor-pointer active:scale-[0.995] transition-transform"
      >
        {children}
      </motion.div>
    </div>
  );
};
