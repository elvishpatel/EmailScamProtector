import { setupMessageHandler } from './message-handler';
import { updateSettings } from '../services/storage';
import { DEFAULT_SETTINGS } from '../types/settings';
import { log } from '../utils/logger';

// ---------------------------------------------------------------------------
// Initialise the message handler
// ---------------------------------------------------------------------------

setupMessageHandler();

log('ServiceWorker', 'Email Scam Protector service worker started');

// ---------------------------------------------------------------------------
// First-install setup
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    log('ServiceWorker', 'Extension installed — applying default settings');

    updateSettings(DEFAULT_SETTINGS).catch((err) =>
      console.error('[ESP] Failed to set default settings:', err),
    );
  } else if (details.reason === 'update') {
    log('ServiceWorker', 'Extension updated', {
      previousVersion: details.previousVersion,
    });
  }
});

// ---------------------------------------------------------------------------
// Extension icon click (optional — opens Gmail if no popup is configured)
// ---------------------------------------------------------------------------

chrome.action.onClicked.addListener(async () => {
  try {
    // Attempt to focus an existing Gmail tab
    const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });

    if (tabs.length > 0 && tabs[0].id !== undefined) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      if (tabs[0].windowId !== undefined) {
        await chrome.windows.update(tabs[0].windowId, { focused: true });
      }
    } else {
      // Open Gmail if no tab is found
      await chrome.tabs.create({ url: 'https://mail.google.com/' });
    }
  } catch (err) {
    console.error('[ESP] action.onClicked handler error:', err);
  }
});
