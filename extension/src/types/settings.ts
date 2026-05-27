/** Extension settings configurable by the user */
export interface ExtensionSettings {
  /** Whether AI analysis is enabled (false = rules-only privacy mode) */
  aiEnabled: boolean;
  /** Backend API URL for AI analysis */
  backendUrl: string;
  /** Whether dark mode is active */
  darkMode: boolean;
  /** Whether to show browser notifications for high-risk emails */
  notificationsEnabled: boolean;
  /** Display language */
  language: SupportedLanguage;
  /** Whether to automatically analyze emails on open */
  autoAnalyze: boolean;
  /** Whether the warning panel is visible */
  panelVisible: boolean;
}

/** Languages supported by the extension */
export type SupportedLanguage = 'en' | 'hi';

/** Default settings applied on first install */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  aiEnabled: true,
  backendUrl: 'http://localhost:3001',
  darkMode: false,
  notificationsEnabled: true,
  language: 'en',
  autoAnalyze: true,
  panelVisible: true,
};
