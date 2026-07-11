import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import type { User } from '../types';

const roleColors: Record<string, { backgroundColor: string; color: string }> = {
  admin:      { backgroundColor: '#fff3e0', color: '#f97316' },
  front_desk: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  technician: { backgroundColor: '#dcfce7', color: '#16a34a' },
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User',   email: 'admin@shop.com',    role: 'admin',      created_at: '2025-01-10T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: '2', name: 'Maria Lopez',  email: 'maria@shop.com',    role: 'front_desk', created_at: '2025-02-14T00:00:00Z', updated_at: '2025-02-14T00:00:00Z' },
  { id: '3', name: 'Carlos Reyes', email: 'carlos@shop.com',   role: 'technician', created_at: '2025-03-01T00:00:00Z', updated_at: '2025-03-01T00:00:00Z' },
  { id: '4', name: 'John Smith',   email: 'john@shop.com',     role: 'technician', created_at: '2025-04-20T00:00:00Z', updated_at: '2025-04-20T00:00:00Z' },
  { id: '5', name: 'Sandra Cruz',  email: 'sandra@shop.com',   role: 'front_desk', created_at: '2025-05-05T00:00:00Z', updated_at: '2025-05-05T00:00:00Z' },
];

export default function Users() {
  const { t } = useTranslation();
  const users = MOCK_USERS;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
          {t('users.title')}
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0f1f3d' }}>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('users.name')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('users.email')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('users.role')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('users.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-100 hover:bg-orange-50/40 transition-colors"
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-800">{user.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={roleColors[user.role] ?? { backgroundColor: '#f3f4f6', color: '#374151' }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </Layout>
  );
}
