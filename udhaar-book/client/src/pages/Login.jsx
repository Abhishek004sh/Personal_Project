import { useState } from 'react';
import { api, auth } from '../api.js';
import { t } from '../strings.js';
import LanguageSwitch from '../components/LanguageSwitch.jsx';

export default function Login({ onLoggedIn, lang, onLang }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await api.login(password);
      auth.set(token);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <LanguageSwitch lang={lang} onChange={onLang} className="on-light login-lang" />
      <img src="/icon-192.png" alt="" width="72" height="72" className="login-logo" />
      <h1>{t.appName}</h1>
      <form onSubmit={submit} className="form">
        <label>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn primary wide" disabled={busy}>
          {busy ? t.loggingIn : t.loginButton}
        </button>
      </form>
    </main>
  );
}
