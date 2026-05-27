import React from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Accessible toggle switch with label and optional description */
export function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="font-display font-semibold text-sm text-text-primary dark:text-text-primary-dark
                    cursor-pointer block"
        >
          {label}
        </label>
        {description && (
          <p className="font-body text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 flex-shrink-0 rounded-full
                   border-2 border-transparent transition-colors duration-200 ease-in-out
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-low min-w-touch min-h-[32px]
                   ${checked
                     ? 'bg-safe'
                     : 'bg-surface-border dark:bg-surface-border-dark'
                   }
                   ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 rounded-full
                     bg-white shadow-md transform transition-transform duration-200
                     ${checked ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
