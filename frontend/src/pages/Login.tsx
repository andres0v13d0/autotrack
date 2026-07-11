import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    // Mock login — bypasses backend for frontend-only demo
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: values.email,
      role: 'admin' as const,
    };
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0f1f3d' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: '#0f1f3d' }}>
        <div className="flex items-center gap-3">
          {/* Logo placeholder — swap with <img> once logo arrives */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg"
            style={{ backgroundColor: '#f97316' }}
          >
            A
          </div>
          <span className="text-white text-xl font-semibold tracking-wide">AutoTrack</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Manage your shop<br />
            <span style={{ color: '#f97316' }}>smarter, faster.</span>
          </h2>
          <p className="text-blue-200 text-base">
            Work orders, payments, and invoices — all in one place.
          </p>
        </div>

        <p className="text-blue-300 text-xs">© {new Date().getFullYear()} AutoTrack</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: '#f97316' }}
            >
              A
            </div>
            <span className="text-xl font-semibold" style={{ color: '#0f1f3d' }}>AutoTrack</span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
              {t('login.title')}
            </h1>
            <LanguageToggle />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0f1f3d' }}>
                {t('login.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: errors.email ? '#ef4444' : '#d1d5db' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#d1d5db')}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{t('login.emailRequired')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0f1f3d' }}>
                {t('login.password')}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: errors.password ? '#ef4444' : '#d1d5db' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.password ? '#ef4444' : '#d1d5db')}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{t('login.passwordMin')}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm text-center">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#f97316' }}
              onMouseEnter={e => !isSubmitting && (e.currentTarget.style.backgroundColor = '#ea6c0a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f97316')}
            >
              {isSubmitting ? '...' : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
