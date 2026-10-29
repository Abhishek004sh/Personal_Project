import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './api.js';
import { t, getLang, setLang } from './strings.js';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import LanguageSwitch from './components/LanguageSwitch.jsx';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!auth.token);

  // `lang` is only here so the whole app redraws when the language changes.
  // The words themselves come from strings.js.
  const [lang, setLangState] = useState(getLang());
  function changeLang(next) {
    setLang(next);
    setLangState(next);
  }

  // The api layer fires this when the server says the login has ended.
  useEffect(() => {
    const onLogout = () => setLoggedIn(false);
    window.addEventListener('udhaar-logout', onLogout);
    return () => window.removeEventListener('udhaar-logout', onLogout);
  }, []);

  if (!loggedIn) return <Login onLoggedIn={() => setLoggedIn(true)} lang={lang} onLang={changeLang} />;

  function logout() {
    auth.clear();
    setLoggedIn(false);
  }

  return (
    <BrowserRouter>
      <header className="topbar">
        <span className="brand">{t.appName}</span>
        <div className="topbar-right">
          <LanguageSwitch lang={lang} onChange={changeLang} />
          <button type="button" className="link-btn light" onClick={logout}>{t.logout}</button>
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* key makes React start a fresh list (search box, sorting) when you move between the two sections */}
          <Route path="/customers" element={<Customers key="customer" kind="customer" />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/suppliers" element={<Customers key="supplier" kind="supplier" />} />
          <Route path="/suppliers/:id" element={<CustomerDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end>{t.navHome}</NavLink>
        <NavLink to="/customers">{t.navCustomers}</NavLink>
        <NavLink to="/suppliers">{t.navSuppliers}</NavLink>
      </nav>
    </BrowserRouter>
  );
}
