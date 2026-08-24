import React from 'react';
import { motion } from 'framer-motion';
import { haptics } from '../../utils/haptics';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <div
      className={`relative flex items-center p-1 bg-ios-tertiaryCard-light dark:bg-ios-secondaryCard-dark rounded-xl select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!isSelected) {
                haptics.impactLight();
                onChange(option.value);
              }
            }}
            className={`relative flex-1 flex items-center justify-center gap-1.5 ${
              isSm ? 'py-1.5 text-xs' : 'py-2 text-sm'
            } font-medium transition-colors z-10 text-center ${
              isSelected
                ? 'text-ios-text-light dark:text-ios-text-dark font-semibold'
                : 'text-ios-text-secondaryLight dark:text-ios-text-secondaryDark hover:text-ios-text-light dark:hover:text-ios-text-dark'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-slider"
                className="absolute inset-0 bg-white dark:bg-ios-card-dark rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected
                    ? 'bg-ios-blue text-white'
                    : 'bg-black/5 dark:bg-white/10 text-ios-text-secondaryLight dark:text-ios-text-secondaryDark'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
