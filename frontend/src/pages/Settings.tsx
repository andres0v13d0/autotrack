import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import Field, { inputCls } from '../components/ui/Field';
import { settingsService } from '../services/settings.service';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const settingsSchema = z.object({
  tax_rate: z.number().min(0).max(1),
  shop_name: z.string().min(2),
  shop_address: z.string().optional(),
  shop_phone: z.string().optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { isRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (!isRole('admin')) {
      navigate('/dashboard');
    }
  }, [isRole, navigate]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      tax_rate: settings.tax_rate,
      shop_name: settings.shop_name,
      shop_address: settings.shop_address,
      shop_phone: settings.shop_phone,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) => settingsService.updateSettings(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center text-gray-500">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#0f1f3d' }}>
          Shop Settings
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Tax Rate (%)" error={errors.tax_rate?.message}>
              <div className="flex items-center gap-2">
                <input
                  {...register('tax_rate', { valueAsNumber: true })}
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  className={inputCls(!!errors.tax_rate)}
                  placeholder="0.0875"
                />
                <span className="text-sm text-gray-600">× 100</span>
              </div>
            </Field>

            <Field label="Shop Name" error={errors.shop_name?.message}>
              <input
                {...register('shop_name')}
                className={inputCls(!!errors.shop_name)}
                placeholder="AutoTrack Shop"
              />
            </Field>

            <Field label="Shop Address" error={errors.shop_address?.message}>
              <textarea
                {...register('shop_address')}
                className={`${inputCls(!!errors.shop_address)} min-h-24 resize-none`}
                placeholder="123 Main St, Miami, FL 33101"
              />
            </Field>

            <Field label="Shop Phone" error={errors.shop_phone?.message}>
              <input
                {...register('shop_phone')}
                className={inputCls(!!errors.shop_phone)}
                placeholder="(305) 555-1234"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {updateMutation.isSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Settings updated successfully
          </div>
        )}
      </div>
    </Layout>
  );
}
