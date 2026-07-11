import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEN = i18n.language === 'en';

  return (
    <button
      onClick={() => i18n.changeLanguage(isEN ? 'es' : 'en')}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
      style={{
        backgroundColor: 'rgba(249,115,22,0.15)',
        color: '#f97316',
        border: '1px solid rgba(249,115,22,0.3)',
      }}
      aria-label="Toggle language"
    >
      <span>{isEN ? '🇺🇸' : '🇪🇸'}</span>
      <span>{isEN ? 'ES' : 'EN'}</span>
    </button>
  );
}
