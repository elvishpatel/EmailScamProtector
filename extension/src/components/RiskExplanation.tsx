import React, { useState } from 'react';
import type { AnalysisResult } from '../types/analysis';
import { RiskLevel } from '../types/analysis';

interface RiskExplanationProps {
  result: AnalysisResult;
}

/** Human-friendly explanation card showing analysis details */
export function RiskExplanation({ result }: RiskExplanationProps) {
  const [expanded, setExpanded] = useState(false);

  const mainExplanation = result.explanations[0] ?? 'No specific concerns found.';
  const additionalExplanations = result.explanations.slice(1);
  const hasDetails = additionalExplanations.length > 0 ||
                     result.linkAnalysis.suspiciousLinks > 0 ||
                     result.senderVerification.isMismatch;

  return (
    <div className="card space-y-3 animate-slide-up">
      {/* Main explanation */}
      <p className="font-body text-base leading-relaxed text-text-primary dark:text-text-primary-dark">
        {mainExplanation}
      </p>

      {/* Sender warning */}
      {result.senderVerification.isMismatch && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-suspicious-50 dark:bg-suspicious/10
                       border border-suspicious/20">
          <span className="text-lg flex-shrink-0 mt-0.5">👤</span>
          <div>
            <p className="font-display font-semibold text-sm text-suspicious-dark dark:text-suspicious">
              Sender Identity Concern
            </p>
            <p className="font-body text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
              {result.senderVerification.explanation}
            </p>
            <div className="mt-2 text-xs font-mono space-y-0.5">
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Shows as: <span className="font-bold">{result.senderVerification.displayName}</span>
              </p>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Actual domain: <span className="font-bold text-suspicious-dark dark:text-suspicious">
                  {result.senderVerification.actualDomain}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Link warnings */}
      {result.linkAnalysis.suspiciousLinks > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-high-50 dark:bg-high/10
                       border border-high/20">
          <span className="text-lg flex-shrink-0 mt-0.5">🔗</span>
          <div>
            <p className="font-display font-semibold text-sm text-high-dark dark:text-high">
              {result.linkAnalysis.suspiciousLinks} Suspicious Link{result.linkAnalysis.suspiciousLinks > 1 ? 's' : ''} Found
            </p>
            <ul className="mt-1.5 space-y-1">
              {result.linkAnalysis.details
                .filter(d => d.issues.length > 0)
                .slice(0, 3)
                .map((detail, i) => (
                  <li key={i} className="font-body text-xs text-text-secondary dark:text-text-secondary-dark">
                    • {detail.issues[0]}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* Expandable additional details */}
      {hasDetails && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-display font-semibold
                      text-low dark:text-low hover:text-low-dark dark:hover:text-low
                      transition-colors"
            aria-expanded={expanded}
          >
            <span className={`transform transition-transform duration-200
                            ${expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {expanded ? 'Hide details' : 'See more details'}
          </button>

          {expanded && (
            <div className="space-y-2 pl-4 border-l-2 border-surface-border dark:border-surface-border-dark
                           animate-slide-down">
              {additionalExplanations.map((exp, i) => (
                <p key={i} className="font-body text-sm text-text-secondary dark:text-text-secondary-dark">
                  • {exp}
                </p>
              ))}

              {/* AI analysis info */}
              {result.aiAnalysis && (
                <p className="text-xs text-text-secondary dark:text-text-secondary-dark italic mt-2">
                  AI confidence: {Math.round(result.aiAnalysis.confidence * 100)}%
                  {' · '}Analyzed with: {result.analyzedWith}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
