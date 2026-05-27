import React from 'react';
import type { AnalysisResult, AnalysisSummary } from '../../types/analysis';
import { RiskLevel } from '../../types/analysis';
import { RiskBadge } from '../../components/RiskBadge';
import { RiskExplanation } from '../../components/RiskExplanation';
import { SafetyActions } from '../../components/SafetyTip';
import { AnalysisHistory } from '../../components/AnalysisHistory';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface DashboardProps {
  currentResult: AnalysisResult | null;
  history: AnalysisSummary[];
  loading: boolean;
  onRefresh: () => void;
}

/** Main dashboard page showing current analysis and history */
export function Dashboard({ currentResult, history, loading, onRefresh }: DashboardProps) {
  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="space-y-5">
      {/* Status Shield */}
      <StatusShield result={currentResult} onRefresh={onRefresh} />

      {/* Current Analysis */}
      {currentResult && (
        <section className="space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="font-display font-bold text-lg text-text-primary dark:text-text-primary-dark">
            Current Email
          </h2>
          <RiskExplanation result={currentResult} />
          {currentResult.riskLevel !== RiskLevel.SAFE && (
            <SafetyActions actions={currentResult.recommendedActions} />
          )}
        </section>
      )}

      {/* Quick Tips (when no current analysis) */}
      {!currentResult && (
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <QuickTips />
        </section>
      )}

      {/* History */}
      <section className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text-primary dark:text-text-primary-dark">
            Recent Scans
          </h2>
          {history.length > 0 && (
            <span className="text-xs font-body text-text-secondary dark:text-text-secondary-dark">
              {history.length} scan{history.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <AnalysisHistory items={history} />
      </section>
    </div>
  );
}

/** Large shield icon showing overall protection status */
function StatusShield({
  result,
  onRefresh,
}: {
  result: AnalysisResult | null;
  onRefresh: () => void;
}) {
  const level = result?.riskLevel ?? null;

  // Determine shield state
  const config = level
    ? getShieldConfig(level)
    : {
        gradient: 'from-safe to-safe-dark',
        glow: 'shadow-glow-safe',
        icon: '🛡️',
        title: 'Protected',
        subtitle: 'Open an email in Gmail to scan it',
      };

  return (
    <div className="relative overflow-hidden rounded-3xl animate-scale-in">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10
                      dark:opacity-20`} />

      {/* Content */}
      <div className={`relative card ${config.glow} border-0 text-center py-6`}>
        <div className="text-5xl mb-3">{config.icon}</div>
        <h2 className="font-display font-extrabold text-2xl text-text-primary dark:text-text-primary-dark">
          {config.title}
        </h2>
        <p className="font-body text-sm text-text-secondary dark:text-text-secondary-dark mt-1.5 max-w-xs mx-auto">
          {config.subtitle}
        </p>

        {result && (
          <div className="mt-4 flex justify-center">
            <RiskBadge level={result.riskLevel} score={result.riskScore} size="lg" />
          </div>
        )}

        <button
          onClick={onRefresh}
          className="mt-4 font-body text-xs text-text-secondary dark:text-text-secondary-dark
                    hover:text-low transition-colors inline-flex items-center gap-1.5"
          aria-label="Refresh analysis"
        >
          <span className="text-sm">🔄</span> Refresh
        </button>
      </div>
    </div>
  );
}

function getShieldConfig(level: RiskLevel) {
  const configs: Record<RiskLevel, {
    gradient: string;
    glow: string;
    icon: string;
    title: string;
    subtitle: string;
  }> = {
    [RiskLevel.SAFE]: {
      gradient: 'from-safe to-safe-dark',
      glow: 'shadow-glow-safe',
      icon: '✅',
      title: 'This Email Looks Safe',
      subtitle: 'No warning signs were found in this email.',
    },
    [RiskLevel.LOW_RISK]: {
      gradient: 'from-low to-low-dark',
      glow: '',
      icon: 'ℹ️',
      title: 'Low Risk',
      subtitle: 'A few unusual patterns found, but likely safe.',
    },
    [RiskLevel.SUSPICIOUS]: {
      gradient: 'from-suspicious to-suspicious-dark',
      glow: '',
      icon: '⚠️',
      title: 'Be Careful',
      subtitle: 'This email has signs of a possible scam.',
    },
    [RiskLevel.HIGH_RISK]: {
      gradient: 'from-high to-high-dark',
      glow: 'shadow-glow-danger',
      icon: '🚨',
      title: 'Warning — High Risk',
      subtitle: 'This email uses tactics commonly found in scams.',
    },
    [RiskLevel.DANGEROUS]: {
      gradient: 'from-dangerous to-dangerous-dark',
      glow: 'shadow-glow-danger',
      icon: '🛑',
      title: 'DANGER — Likely a Scam',
      subtitle: 'This email is very likely trying to steal your information or money.',
    },
  };
  return configs[level];
}

/** Quick safety tips shown when no email is being analyzed */
function QuickTips() {
  const tips = [
    { icon: '🔑', text: 'Never share your passwords or OTP codes via email.' },
    { icon: '📞', text: 'If an email asks for money, call the company directly to verify.' },
    { icon: '🔗', text: "Don't click links in emails that create urgency or fear." },
    { icon: '👪', text: 'When in doubt, ask a trusted family member for advice.' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-display font-bold text-lg text-text-primary dark:text-text-primary-dark">
        Stay Safe — Quick Tips
      </h2>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="card flex items-start gap-3 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-xl flex-shrink-0">{tip.icon}</span>
            <p className="font-body text-sm text-text-primary dark:text-text-primary-dark leading-relaxed">
              {tip.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
