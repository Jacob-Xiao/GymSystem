import React from 'react';
import { useI18n, LANGUAGES } from '../i18n';

/**
 * Compact language switch for the top navigation bar.
 *
 * Rendered as a button group rather than a <select> so the current language is always
 * visible, and as real buttons so it is keyboard reachable without extra work.
 */
const LanguageSwitch = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="btn-group btn-group-sm me-2" role="group" aria-label={t('app.language')}>
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`btn btn-outline-light ${language === item.code ? 'active' : ''}`}
          aria-pressed={language === item.code}
          onClick={() => setLanguage(item.code)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
