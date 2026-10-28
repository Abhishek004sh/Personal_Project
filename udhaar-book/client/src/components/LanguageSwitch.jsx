import { LANGS, t } from '../strings.js';

// One small button that shows the language in use. Tap it to move to the next one:
// Hinglish -> हिन्दी -> English -> Hinglish ...
export default function LanguageSwitch({ lang, onChange, className = '' }) {
  const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
  return (
    <button
      type="button"
      className={`lang-btn ${className}`}
      onClick={() => onChange(next)}
      aria-label={t.languageChange}
    >
      {t.languageName}
    </button>
  );
}
