import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Loading spinner with optional message */
export function LoadingSpinner({ message = 'Analyzing email...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-3 border-surface-border
                        dark:border-surface-border-dark border-t-safe animate-spin`} />
        <div className={`${sizeClasses[size]} rounded-full border-3 border-transparent
                        border-b-safe/30 animate-spin absolute inset-0`}
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      {message && (
        <p className="font-display font-semibold text-sm text-text-secondary dark:text-text-secondary-dark
                     animate-pulse-slow">
          {message}
        </p>
      )}
    </div>
  );
}
