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
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await registerUser(values.firstName, values.lastName, values.email, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — form (white on mobile, blue on desktop) */}
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

          <h1 className="text-3xl font-bold text-slate-900 lg:text-white mb-2">
            {t('register.title')}
          </h1>
          <p className="text-gray-600 lg:text-gray-400 text-sm mb-8">
            {t('register.subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('register.firstName')}
              </label>
              <input
                type="text"
                autoComplete="given-name"
                {...register('firstName')}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white text-slate-900 ${
                  errors.firstName
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-offset-0'
                }`}
                onFocus={(e) => !errors.firstName && (e.currentTarget.style.borderColor = '#fe8a0e')}
                onBlur={(e) => (e.currentTarget.style.borderColor = errors.firstName ? '#f87171' : '#d1d5db')}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('register.lastName')}
              </label>
              <input
                type="text"
                autoComplete="family-name"
                {...register('lastName')}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white text-slate-900 ${
                  errors.lastName
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-offset-0'
                }`}
                onFocus={(e) => !errors.lastName && (e.currentTarget.style.borderColor = '#fe8a0e')}
                onBlur={(e) => (e.currentTarget.style.borderColor = errors.lastName ? '#f87171' : '#d1d5db')}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('register.email')}
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
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('register.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 lg:text-white mb-2">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white text-slate-900 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-offset-0'
                  }`}
                  onFocus={(e) => !errors.confirmPassword && (e.currentTarget.style.borderColor = '#fe8a0e')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.confirmPassword ? '#f87171' : '#d1d5db')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
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
              {isSubmitting ? '...' : t('register.submit')}
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              {t('register.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-slate-900 font-semibold hover:underline cursor-pointer"
                style={{ color: '#fe8a0e' }}
              >
                {t('register.loginLink')}
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Right panel — branding (hidden on mobile, white on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-between p-12">
        <div></div>

        <div className="flex flex-col items-center text-center">
          <img 
            src="/logo.jpeg" 
            alt="AutoTrack Logo" 
            className="w-48 h-auto object-contain mb-8"
          />
          <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Join AutoTrack
            <br />
            <span style={{ color: '#fe8a0e' }}>today.</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Start managing your auto repair shop efficiently with our all-in-one platform.
          </p>
        </div>

        <p className="text-gray-400 text-sm text-center">© {new Date().getFullYear()} AutoTrack</p>
      </div>
    </div>
  );
}
