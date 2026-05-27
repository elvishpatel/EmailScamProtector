import React from 'react';
import type { AnalysisSummary } from '../types/analysis';
import { RiskLevel } from '../types/analysis';
import { RiskBadge } from './RiskBadge';

interface AnalysisHistoryProps {
  items: AnalysisSummary[];
  loading?: boolean;
}

/** List of recent email analyses */
export function AnalysisHistory({ items, loading }: AnalysisHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-shimmer bg-gradient-to-r from-surface-card
                                  via-surface-border/20 to-surface-card dark:from-surface-card-dark
                                  dark:via-surface-border-dark/20 dark:to-surface-card-dark
                                  bg-[length:200%_100%] h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-8">
        <span className="text-3xl block mb-3">📭</span>
        <p className="font-display font-semibold text-sm text-text-secondary dark:text-text-secondary-dark">
          No emails analyzed yet
        </p>
        <p className="font-body text-xs text-text-secondary dark:text-text-secondary-dark mt-1">
          Open an email in Gmail to start scanning
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <HistoryItem key={item.emailId} item={item} index={index} />
      ))}
    </div>
  );
}

function HistoryItem({ item, index }: { item: AnalysisSummary; index: number }) {
  const timeAgo = getTimeAgo(item.timestamp);

  return (
    <div
      className="card flex items-start gap-3 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <RiskBadge level={item.riskLevel} size="sm" showLabel={false} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-text-primary dark:text-text-primary-dark
                     truncate">
          {item.subject || 'No subject'}
        </p>
        <p className="font-body text-xs text-text-secondary dark:text-text-secondary-dark truncate mt-0.5">
          {item.senderName} ({item.senderEmail})
        </p>
        <p className="font-body text-xs text-text-secondary dark:text-text-secondary-dark mt-1 line-clamp-2">
          {item.shortExplanation}
        </p>
      </div>
      <span className="text-xs text-text-secondary dark:text-text-secondary-dark flex-shrink-0 mt-1">
        {timeAgo}
      </span>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
