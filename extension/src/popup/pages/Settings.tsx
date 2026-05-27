import React, { useState } from 'react';
import type { ExtensionSettings } from '../../types/settings';
import { ToggleSwitch } from '../../components/ToggleSwitch';

interface SettingsProps {
  settings: ExtensionSettings;
  onUpdate: (updates: Partial<ExtensionSettings>) => void;
  onClearCache: () => void;
}

/** Extension settings page */
export function Settings({ settings, onUpdate, onClearCache }: SettingsProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);

  const handleBackendUrlBlur = () => {
    if (backendUrl !== settings.backendUrl) {
      onUpdate({ backendUrl: backendUrl.replace(/\/+$/, '') });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="font-display font-bold text-xl text-text-primary dark:text-text-primary-dark">
        Settings
      </h2>

      {/* Analysis Settings */}
      <section className="card space-y-1">
        <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark mb-2">
          🔍 Analysis
        </h3>

        <ToggleSwitch
          id="auto-analyze"
          label="Auto-analyze emails"
          description="Automatically scan emails when you open them"
          checked={settings.autoAnalyze}
          onChange={(checked) => onUpdate({ autoAnalyze: checked })}
        />

        <ToggleSwitch
          id="ai-enabled"
          label="AI-powered analysis"
          description="Uses Gemini AI for deeper analysis. Turn off for privacy mode (rules only)."
          checked={settings.aiEnabled}
          onChange={(checked) => onUpdate({ aiEnabled: checked })}
        />

        <ToggleSwitch
          id="panel-visible"
          label="Show warning panel in Gmail"
          description="Display analysis results directly inside Gmail"
          checked={settings.panelVisible}
          onChange={(checked) => onUpdate({ panelVisible: checked })}
        />
      </section>

      {/* Backend URL */}
      <section className="card space-y-3">
        <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark">
          🌐 Backend Server
        </h3>
        <div>
          <label
            htmlFor="backend-url"
            className="font-body text-xs text-text-secondary dark:text-text-secondary-dark block mb-1.5"
          >
            Server URL (for AI analysis)
          </label>
          <input
            id="backend-url"
            type="url"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            onBlur={handleBackendUrlBlur}
            placeholder="http://localhost:3001"
            className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border
                      dark:border-surface-border-dark bg-surface-DEFAULT dark:bg-surface-dark
                      font-body text-sm text-text-primary dark:text-text-primary-dark
                      focus:border-low focus:ring-1 focus:ring-low outline-none
                      transition-colors"
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="card space-y-1">
        <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark mb-2">
          🎨 Appearance
        </h3>

        <ToggleSwitch
          id="dark-mode"
          label="Dark mode"
          description="Use a darker color scheme"
          checked={settings.darkMode}
          onChange={(checked) => onUpdate({ darkMode: checked })}
        />

        <ToggleSwitch
          id="notifications"
          label="Notifications"
          description="Show alerts for high-risk emails"
          checked={settings.notificationsEnabled}
          onChange={(checked) => onUpdate({ notificationsEnabled: checked })}
        />
      </section>

      {/* Language */}
      <section className="card space-y-3">
        <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark">
          🌍 Language
        </h3>
        <div className="flex gap-2">
          {[
            { value: 'en' as const, label: 'English', flag: '🇬🇧' },
            { value: 'hi' as const, label: 'हिन्दी', flag: '🇮🇳' },
          ].map((lang) => (
            <button
              key={lang.value}
              onClick={() => onUpdate({ language: lang.value })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                         font-display font-semibold text-sm transition-all duration-200
                         min-h-touch
                         ${settings.language === lang.value
                           ? 'bg-safe/10 dark:bg-safe/20 text-safe-dark dark:text-safe border-2 border-safe/30'
                           : 'bg-surface-DEFAULT dark:bg-surface-dark border-2 border-surface-border dark:border-surface-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-safe/30'
                         }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="card space-y-3">
        <h3 className="font-display font-bold text-sm text-text-primary dark:text-text-primary-dark">
          🗃️ Data
        </h3>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-secondary w-full text-sm"
          >
            🗑️ Clear scan history and cache
          </button>
        ) : (
          <div className="space-y-2.5">
            <p className="font-body text-sm text-text-secondary dark:text-text-secondary-dark">
              This will delete all saved scan results. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClearCache();
                  setShowClearConfirm(false);
                }}
                className="flex-1 btn-primary bg-high hover:bg-high-dark text-sm"
              >
                Yes, clear all
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Version info */}
      <p className="text-center font-body text-xs text-text-secondary dark:text-text-secondary-dark py-2">
        Email Scam Protector v1.0.0
      </p>
    </div>
  );
}
