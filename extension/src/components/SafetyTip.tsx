import React from 'react';

interface SafetyTipProps {
  icon: string;
  text: string;
  variant?: 'default' | 'warning' | 'success';
}

const VARIANT_CLASSES = {
  default: 'bg-surface-card dark:bg-surface-card-dark border-surface-border dark:border-surface-border-dark',
  warning: 'bg-suspicious-50 dark:bg-suspicious/10 border-suspicious/30',
  success: 'bg-safe-50 dark:bg-safe/10 border-safe/30',
};

/** Safety recommendation card with icon */
export function SafetyTip({ icon, text, variant = 'default' }: SafetyTipProps) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${VARIANT_CLASSES[variant]}
                    transition-all duration-200 hover:shadow-soft`}>
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <p className="font-body text-sm leading-relaxed text-text-primary dark:text-text-primary-dark">
        {text}
      </p>
    </div>
  );
}

/** List of recommended actions from analysis */
export function SafetyActions({ actions }: { actions: string[] }) {
  if (actions.length === 0) return null;

  const actionIcons = ['🛡️', '📞', '🚫', '👪', '🔒', '⚠️', '📧', '🗑️'];

  return (
    <div className="space-y-2">
      <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark">
        What you should do:
      </h3>
      {actions.map((action, i) => (
        <SafetyTip
          key={i}
          icon={actionIcons[i % actionIcons.length]}
          text={action}
          variant="warning"
        />
      ))}
    </div>
  );
}
