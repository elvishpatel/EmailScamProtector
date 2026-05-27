import React from 'react';
import { RiskLevel } from '../types/analysis';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RISK_CONFIG: Record<RiskLevel, {
  label: string;
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  pulseClass?: string;
}> = {
  [RiskLevel.SAFE]: {
    label: 'Safe',
    icon: '✅',
    bgClass: 'bg-safe-50 dark:bg-safe/10',
    textClass: 'text-safe-dark dark:text-safe',
    borderClass: 'border-safe/30',
  },
  [RiskLevel.LOW_RISK]: {
    label: 'Low Risk',
    icon: 'ℹ️',
    bgClass: 'bg-low-50 dark:bg-low/10',
    textClass: 'text-low-dark dark:text-low',
    borderClass: 'border-low/30',
  },
  [RiskLevel.SUSPICIOUS]: {
    label: 'Suspicious',
    icon: '⚠️',
    bgClass: 'bg-suspicious-50 dark:bg-suspicious/10',
    textClass: 'text-suspicious-dark dark:text-suspicious',
    borderClass: 'border-suspicious/30',
  },
  [RiskLevel.HIGH_RISK]: {
    label: 'High Risk',
    icon: '🚨',
    bgClass: 'bg-high-50 dark:bg-high/10',
    textClass: 'text-high-dark dark:text-high',
    borderClass: 'border-high/30',
  },
  [RiskLevel.DANGEROUS]: {
    label: 'Dangerous',
    icon: '🛑',
    bgClass: 'bg-dangerous-50 dark:bg-dangerous/10',
    textClass: 'text-dangerous-dark dark:text-dangerous',
    borderClass: 'border-dangerous/30',
    pulseClass: 'animate-pulse-slow',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  md: 'px-3.5 py-1.5 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
};

/** Color-coded risk level badge with icon */
export function RiskBadge({ level, score, size = 'md', showLabel = true }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center font-display font-bold border
                 ${config.bgClass} ${config.textClass} ${config.borderClass}
                 ${SIZE_CLASSES[size]} ${config.pulseClass ?? ''}`}
      role="status"
      aria-label={`Risk level: ${config.label}${score !== undefined ? `, score: ${score}` : ''}`}
    >
      <span className="flex-shrink-0">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
      {score !== undefined && (
        <span className="opacity-70 font-semibold">({score})</span>
      )}
    </span>
  );
}

/** Get the risk color hex value for use in inline styles */
export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    [RiskLevel.SAFE]: '#22C55E',
    [RiskLevel.LOW_RISK]: '#3B82F6',
    [RiskLevel.SUSPICIOUS]: '#F59E0B',
    [RiskLevel.HIGH_RISK]: '#EF4444',
    [RiskLevel.DANGEROUS]: '#DC2626',
  };
  return colors[level];
}
