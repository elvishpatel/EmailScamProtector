import type { EmailData } from './email';
import type { AnalysisResult, AnalysisSummary } from './analysis';
import type { ExtensionSettings } from './settings';

/** All message types for Chrome runtime messaging */
export enum MessageType {
  /** Content script → Background: analyze this email */
  ANALYZE_EMAIL = 'ANALYZE_EMAIL',
  /** Background → Content script: analysis results */
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  /** Popup → Background: get result for current email */
  GET_CURRENT_RESULT = 'GET_CURRENT_RESULT',
  /** Popup → Background: get analysis history */
  GET_HISTORY = 'GET_HISTORY',
  /** Popup → Background: get current settings */
  GET_SETTINGS = 'GET_SETTINGS',
  /** Popup → Background: update settings */
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  /** Popup → Background: clear analysis cache */
  CLEAR_CACHE = 'CLEAR_CACHE',
  /** Background → Content script: show/hide panel */
  TOGGLE_PANEL = 'TOGGLE_PANEL',
}

/** Content script requests email analysis */
export interface AnalyzeEmailMessage {
  type: MessageType.ANALYZE_EMAIL;
  payload: EmailData;
}

/** Background returns analysis result */
export interface AnalysisResultMessage {
  type: MessageType.ANALYSIS_RESULT;
  payload: AnalysisResult;
}

/** Popup requests current analysis */
export interface GetCurrentResultMessage {
  type: MessageType.GET_CURRENT_RESULT;
}

/** Popup requests analysis history */
export interface GetHistoryMessage {
  type: MessageType.GET_HISTORY;
  payload?: { limit?: number };
}

/** Popup requests settings */
export interface GetSettingsMessage {
  type: MessageType.GET_SETTINGS;
}

/** Popup updates settings */
export interface UpdateSettingsMessage {
  type: MessageType.UPDATE_SETTINGS;
  payload: Partial<ExtensionSettings>;
}

/** Popup requests cache clear */
export interface ClearCacheMessage {
  type: MessageType.CLEAR_CACHE;
}

/** Toggle warning panel visibility */
export interface TogglePanelMessage {
  type: MessageType.TOGGLE_PANEL;
  payload: { visible: boolean };
}

/** Union of all message types for type-safe message handling */
export type ExtensionMessage =
  | AnalyzeEmailMessage
  | AnalysisResultMessage
  | GetCurrentResultMessage
  | GetHistoryMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ClearCacheMessage
  | TogglePanelMessage;

/** Standard response envelope for message replies */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Typed response types for each message */
export type AnalysisResultResponse = MessageResponse<AnalysisResult>;
export type HistoryResponse = MessageResponse<AnalysisSummary[]>;
export type SettingsResponse = MessageResponse<ExtensionSettings>;
export type VoidResponse = MessageResponse<void>;
