import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding (white on desktop, white on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-between p-12">
        <div></div>

        <div className="flex flex-col items-center text-center">
          <img 
            src="/logo.jpeg" 
            alt="AutoTrack Logo" 
            className="w-48 h-auto object-contain mb-8"
          />
          <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Manage your shop
            <br />
            <span style={{ color: '#fe8a0e' }}>smarter, faster.</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Work orders, payments, and invoices — all in one place.
          </p>
        </div>

        <p className="text-gray-400 text-sm text-center">© {new Date().getFullYear()} AutoTrack</p>
      </div>

      {/* Right panel — form (dark blue on desktop, white on mobile) */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-white lg:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo (centered) */}
          <div className="flex lg:hidden justify-center mb-10">
            <img 
              src="/logo.jpeg" 
              alt="AutoTrack Logo" 
              className="w-32 h-auto object-contain"
            />
          </div>

          <div className="flex justify-end items-center mb-8">
            <LanguageToggle />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 lg:text-white mb-8">
            {t('login.title')}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('login.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white text-slate-900 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-offset-0'
                }`}
                onFocus={(e) => !errors.email && (e.currentTarget.style.borderColor = '#fe8a0e')}
                onBlur={(e) => (e.currentTarget.style.borderColor = errors.email ? '#f87171' : '#d1d5db')}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{t('login.emailRequired')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white text-slate-900 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-offset-0'
                  }`}
                  onFocus={(e) => !errors.password && (e.currentTarget.style.borderColor = '#fe8a0e')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.password ? '#f87171' : '#d1d5db')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              className="w-full text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: '#fe8a0e',
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#e67a0a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fe8a0e')}
            >
              {isSubmitting ? '...' : t('login.submit')}
            </button>

            <p className="text-center text-sm text-gray-600 lg:text-gray-400 mt-6">
              {t('login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold hover:underline cursor-pointer"
                style={{ color: '#fe8a0e' }}
              >
                {t('login.registerLink')}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
