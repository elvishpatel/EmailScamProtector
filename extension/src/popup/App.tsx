import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Education } from './pages/Education';
import type { ExtensionSettings } from '../types/settings';
import type { AnalysisResult, AnalysisSummary } from '../types/analysis';
import { MessageType } from '../types/messages';
import type { MessageResponse } from '../types/messages';
import { DEFAULT_SETTINGS } from '../types/settings';

type Page = 'dashboard' | 'settings' | 'education';

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = settings.darkMode;

  // Load initial data from background
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get settings
      const settingsRes = await chrome.runtime.sendMessage({
        type: MessageType.GET_SETTINGS,
      }) as MessageResponse<ExtensionSettings>;
      if (settingsRes?.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }

      // Get current analysis result
      const resultRes = await chrome.runtime.sendMessage({
        type: MessageType.GET_CURRENT_RESULT,
      }) as MessageResponse<AnalysisResult>;
      if (resultRes?.success && resultRes.data) {
        setCurrentResult(resultRes.data);
      }

      // Get history
      const historyRes = await chrome.runtime.sendMessage({
        type: MessageType.GET_HISTORY,
        payload: { limit: 10 },
      }) as MessageResponse<AnalysisSummary[]>;
      if (historyRes?.success && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.error('[ESP] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const handleUpdateSettings = async (updates: Partial<ExtensionSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await chrome.runtime.sendMessage({
        type: MessageType.UPDATE_SETTINGS,
        payload: updates,
      });
    } catch (err) {
      console.error('[ESP] Failed to update settings:', err);
    }
  };

  const handleClearCache = async () => {
    try {
      await chrome.runtime.sendMessage({ type: MessageType.CLEAR_CACHE });
      setHistory([]);
      setCurrentResult(null);
    } catch (err) {
      console.error('[ESP] Failed to clear cache:', err);
    }
  };

  return (
    <div className={`w-[400px] min-h-[520px] max-h-[600px] overflow-y-auto scrollbar-thin
                     ${isDark ? 'dark bg-surface-dark' : 'bg-surface-DEFAULT'}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-surface-DEFAULT/80 dark:bg-surface-dark/80
                         border-b border-surface-border dark:border-surface-border-dark px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-safe to-safe-dark
                           flex items-center justify-center shadow-soft">
              <span className="text-white text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight
                            text-text-primary dark:text-text-primary-dark">
                Email Protector
              </h1>
              <p className="font-body text-xs text-text-secondary dark:text-text-secondary-dark">
                Keeping you safe
              </p>
            </div>
          </div>

          {/* Nav icons */}
          <nav className="flex items-center gap-1">
            <NavButton
              active={page === 'dashboard'}
              onClick={() => setPage('dashboard')}
              label="Home"
              icon="🏠"
            />
            <NavButton
              active={page === 'education'}
              onClick={() => setPage('education')}
              label="Learn"
              icon="📚"
            />
            <NavButton
              active={page === 'settings'}
              onClick={() => setPage('settings')}
              label="Settings"
              icon="⚙️"
            />
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="p-5 animate-fade-in">
        {page === 'dashboard' && (
          <Dashboard
            currentResult={currentResult}
            history={history}
            loading={loading}
            onRefresh={loadData}
          />
        )}
        {page === 'settings' && (
          <Settings
            settings={settings}
            onUpdate={handleUpdateSettings}
            onClearCache={handleClearCache}
          />
        )}
        {page === 'education' && <Education />}
      </main>
    </div>
  );
}

/** Navigation button component */
function NavButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base
                 transition-all duration-200
                 ${active
                   ? 'bg-safe/10 dark:bg-safe/20 shadow-soft'
                   : 'hover:bg-surface-border/30 dark:hover:bg-surface-border-dark/30'
                 }`}
    >
      {icon}
    </button>
  );
}
