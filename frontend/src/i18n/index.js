import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import messages from './messages';

// A deliberately small i18n layer: a context, a flat message catalog and a `t()` that
// falls back to the key itself. No dependency is added because the app only needs two
// languages and no plural rules or date-localisation beyond what Intl already provides.
//
// The language is a UI preference, not a server concern: it is stored in localStorage so
// it survives a reload and applies to every page without a round trip.

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'zh';

export const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' }
];

function readInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch (_) {
    // localStorage can throw in private mode; fall through to the default.
  }
  return DEFAULT_LANGUAGE;
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  const setLanguage = useCallback((next) => {
    if (next !== 'zh' && next !== 'en') return;
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      // Preference simply will not persist; the session still switches correctly.
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Translate a message key. `params` interpolates `{name}` placeholders.
 *
 * An unknown key is returned verbatim rather than throwing, so a missing translation
 * degrades to readable text instead of crashing a page.
 */
export function translate(language, key, params) {
  const catalog = messages[language] || {};
  const fallback = messages.zh || {};
  let text = catalog[key] !== undefined ? catalog[key] : fallback[key];

  if (text === undefined) return key;

  if (params) {
    text = text.replace(/\{(\w+)\}/g, (match, name) =>
      params[name] !== undefined ? String(params[name]) : match
    );
  }

  return text;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }

  const { language, setLanguage } = context;
  const t = useCallback((key, params) => translate(language, key, params), [language]);

  return { language, setLanguage, t };
}

export default I18nContext;
