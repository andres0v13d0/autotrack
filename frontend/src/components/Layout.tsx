import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import LanguageToggle from './LanguageToggle';
import { Menu, X, LogOut, LayoutDashboard, Users, Users2, ChevronDown, Wrench, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

const slideInStyle = `
  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  .sidebar-slide-in {
    animation: slideInFromLeft 0.3s ease-out forwards;
  }

  .sidebar-slide-out {
    animation: slideOutToLeft 0.3s ease-out forwards;
  }

  .overlay-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

interface NavLinkProps {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick?: () => void;
}

function NavLink({ to, label, icon, active, onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
      style={{
        backgroundColor: active ? 'rgba(254, 138, 14, 0.1)' : 'transparent',
        color: active ? '#fe8a0e' : '#64748b',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.backgroundColor = 'rgba(254, 138, 14, 0.05)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout, isRole } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <style>{slideInStyle}</style>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
        {/* SIDEBAR: Desktop */}
        <aside className="hidden lg:flex lg:w-64 flex-col bg-slate-900 border-r border-slate-800 shadow-xl">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-slate-800/50">
            <img 
              src="/imagotipo_blanco.png" 
              alt="AutoTrack" 
              className="h-10 object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/dashboard"
              label={t('nav.dashboard')}
              icon={<LayoutDashboard size={18} strokeWidth={2} />}
              active={pathname === '/dashboard'}
            />
            {isRole('admin') && (
              <NavLink
                to="/users"
                label={t('nav.users')}
                icon={<Users size={18} strokeWidth={2} />}
                active={pathname === '/users'}
              />
            )}
            <NavLink
              to="/customers"
              label={t('nav.customers')}
              icon={<Users2 size={18} strokeWidth={2} />}
              active={pathname.startsWith('/customers')}
            />
            <NavLink
              to="/work-orders"
              label={t('nav.workOrders')}
              icon={<Wrench size={18} strokeWidth={2} />}
              active={pathname.startsWith('/work-orders')}
            />
            <NavLink
              to="/reports"
              label="Reports"
              icon={<BarChart3 size={18} strokeWidth={2} />}
              active={pathname === '/reports'}
            />
            <NavLink
              to="/settings"
              label="Settings"
              icon={<SettingsIcon size={18} strokeWidth={2} />}
              active={pathname === '/settings'}
            />
          </nav>

          {/* Logout */}
          <div className="px-2 py-4 border-t border-slate-800/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-900 shadow-md sticky top-0 z-40" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
            <div className="flex items-center justify-between px-4 lg:px-6 h-16">
              {/* Left: Hamburger (mobile) */}
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* Right: Language + User */}
              <div className="flex items-center gap-4">
                <LanguageToggle />
                
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {settings?.shop_logo_url ? (
                      <img 
                        src={settings.shop_logo_url}
                        alt="Shop logo"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: '#fe8a0e' }}
                      >
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-600">{user?.email}</p>
                        <p className="text-xs text-slate-500 mt-1">{t(`roles.${user?.role}`)}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Drawer */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-30 lg:hidden overlay-fade-in"
                onClick={closeSidebar}
              />
              <div className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-2xl z-40 lg:hidden overflow-y-auto flex flex-col sidebar-slide-in">
                {/* Logo */}
                <div className="px-4 py-3 border-b border-slate-200">
                  <img 
                    src="/imagotipo.png" 
                    alt="AutoTrack" 
                    className="h-9 object-contain"
                  />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-1">
                  <NavLink
                    to="/dashboard"
                    label={t('nav.dashboard')}
                    icon={<LayoutDashboard size={18} strokeWidth={2} />}
                    active={pathname === '/dashboard'}
                    onClick={closeSidebar}
                  />
                  {isRole('admin') && (
                    <NavLink
                      to="/users"
                      label={t('nav.users')}
                      icon={<Users size={18} strokeWidth={2} />}
                      active={pathname === '/users'}
                      onClick={closeSidebar}
                    />
                  )}
                  <NavLink
                    to="/customers"
                    label={t('nav.customers')}
                    icon={<Users2 size={18} strokeWidth={2} />}
                    active={pathname.startsWith('/customers')}
                    onClick={closeSidebar}
                  />
                  <NavLink
                    to="/work-orders"
                    label={t('nav.workOrders')}
                    icon={<Wrench size={18} strokeWidth={2} />}
                    active={pathname.startsWith('/work-orders')}
                    onClick={closeSidebar}
                  />
                  <NavLink
                    to="/reports"
                    label="Reports"
                    icon={<BarChart3 size={18} strokeWidth={2} />}
                    active={pathname === '/reports'}
                    onClick={closeSidebar}
                  />
                  <NavLink
                    to="/settings"
                    label="Settings"
                    icon={<SettingsIcon size={18} strokeWidth={2} />}
                    active={pathname === '/settings'}
                    onClick={closeSidebar}
                  />
                </nav>

                {/* Logout */}
                <div className="px-2 py-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      closeSidebar();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
