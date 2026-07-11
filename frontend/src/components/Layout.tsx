import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';
import type { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  label: string;
  active: boolean;
}

function NavLink({ to, label, active }: NavLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? 'rgba(249,115,22,0.15)' : 'transparent',
        color: active ? '#f97316' : 'rgba(255,255,255,0.75)',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
      }}
    >
      {label}
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Top navbar */}
      <header
        className="flex items-center justify-between px-6 py-0 h-14 shadow-md"
        style={{ backgroundColor: '#0f1f3d' }}
      >
        {/* Brand + nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 mr-2">
            {/* Logo placeholder */}
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#f97316' }}
            >
              A
            </div>
            <span className="text-white font-semibold text-base tracking-wide">AutoTrack</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" label={t('nav.dashboard')} active={pathname === '/dashboard'} />
            {isRole('admin') && (
              <NavLink to="/users" label={t('nav.users')} active={pathname === '/users'} />
            )}
            <NavLink to="/customers" label={t('nav.customers')} active={pathname.startsWith('/customers')} />
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#f97316' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-white/80">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
