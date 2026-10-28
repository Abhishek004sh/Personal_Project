import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './api.js';
import { t } from './strings.js';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!auth.token);

  // The api layer fires this when the server says the login has ended.
  useEffect(() => {
    const onLogout = () => setLoggedIn(false);
    window.addEventListener('udhaar-logout', onLogout);
    return () => window.removeEventListener('udhaar-logout', onLogout);
  }, []);

  if (!loggedIn) return <Login onLoggedIn={() => setLoggedIn(true)} />;

  function logout() {
    auth.clear();
    setLoggedIn(false);
  }

  return (
    <BrowserRouter>
      <header className="topbar">
        <span className="brand">{t.appName}</span>
        <button type="button" className="link-btn light" onClick={logout}>{t.logout}</button>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end>{t.navHome}</NavLink>
        <NavLink to="/customers">{t.navCustomers}</NavLink>
      </nav>
    </BrowserRouter>
  );
}
