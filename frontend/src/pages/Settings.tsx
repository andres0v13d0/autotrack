import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import Field, { inputCls } from '../components/ui/Field';
import { settingsService } from '../services/settings.service';
import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Phone } from 'lucide-react';

const settingsSchema = z.object({
  shop_name: z.string().min(2).optional(),
  shop_address: z.string().optional(),
  shop_phone: z.string().optional(),
  shop_email: z.string().optional().or(z.literal('')),
  shop_description: z.string().optional(),
  shop_slogan: z.string().optional(),
  shop_logo_url: z.string().optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

type Tab = 'logo' | 'basic' | 'contact';

export default function Settings() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('logo');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      shop_name: settings.shop_name || '',
      shop_address: settings.shop_address || '',
      shop_phone: settings.shop_phone || '',
      shop_email: settings.shop_email || '',
      shop_description: settings.shop_description || '',
      shop_slogan: settings.shop_slogan || '',
      shop_logo_url: settings.shop_logo_url || '',
    } : undefined,
  });

  const logoUrl = watch('shop_logo_url');

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) => settingsService.updateSettings(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/settings/upload-logo`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Upload failed');
      const { url } = await response.json();
      setValue('shop_logo_url', url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = (values: SettingsFormValues) => {
    // Solo enviar los campos que están en la pestaña actual
    let dataToSave: Partial<SettingsFormValues> = {};

    if (activeTab === 'basic') {
      dataToSave = {
        shop_name: values.shop_name,
        shop_slogan: values.shop_slogan,
        shop_description: values.shop_description,
      };
    } else if (activeTab === 'contact') {
      dataToSave = {
        shop_phone: values.shop_phone,
        shop_email: values.shop_email,
        shop_address: values.shop_address,
      };
    } else if (activeTab === 'logo') {
      dataToSave = {
        shop_logo_url: values.shop_logo_url,
      };
    }

    updateMutation.mutate(dataToSave);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center text-gray-500">Loading...</div>
      </Layout>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'logo', label: 'Shop Logo', icon: <ImageIcon size={18} /> },
    { id: 'basic', label: 'Basic Information', icon: <FileText size={18} /> },
    { id: 'contact', label: 'Contact Information', icon: <Phone size={18} /> },
  ];

  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f1f3d' }}>
          Shop Settings
        </h1>
        <p className="text-gray-600 mb-6">Manage your shop information and branding</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-center text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  borderBottomColor: activeTab === tab.id ? '#f97316' : 'transparent',
                  backgroundColor: activeTab === tab.id ? 'rgba(249, 115, 22, 0.05)' : 'transparent',
                  color: activeTab === tab.id ? '#0f1f3d' : undefined,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Shop Logo Tab */}
            {activeTab === 'logo' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="flex-shrink-0">
                    {logoUrl ? (
                      <div className="relative">
                        <img 
                          src={logoUrl} 
                          alt="Shop logo" 
                          className="h-40 w-40 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setValue('shop_logo_url', '')}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-40 w-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60 cursor-pointer transition-colors"
                    >
                      <Upload size={18} />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">PNG, JPG up to 5MB</p>
                    <p className="text-xs text-gray-400 mt-1">Recommended size: 500x500px</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <Field label="Shop Name" error={errors.shop_name?.message}>
                  <input
                    {...register('shop_name')}
                    className={inputCls(!!errors.shop_name)}
                    placeholder="AutoTrack Shop"
                  />
                </Field>

                <Field label="Slogan (Optional)" error={errors.shop_slogan?.message}>
                  <input
                    {...register('shop_slogan')}
                    className={inputCls(!!errors.shop_slogan)}
                    placeholder="Your tagline here"
                  />
                </Field>

                <Field label="Description (Optional)" error={errors.shop_description?.message}>
                  <textarea
                    {...register('shop_description')}
                    className={`${inputCls(!!errors.shop_description)} min-h-24 resize-none`}
                    placeholder="Describe your shop..."
                  />
                </Field>
              </div>
            )}

            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-5">
                <Field label="Phone Number (Optional)" error={errors.shop_phone?.message}>
                  <input
                    {...register('shop_phone')}
                    className={inputCls(!!errors.shop_phone)}
                    placeholder="(305) 555-1234"
                  />
                </Field>

                <Field label="Email (Optional)" error={errors.shop_email?.message}>
                  <input
                    {...register('shop_email')}
                    type="email"
                    className={inputCls(!!errors.shop_email)}
                    placeholder="info@shop.com"
                  />
                </Field>

                <Field label="Address (Optional)" error={errors.shop_address?.message}>
                  <textarea
                    {...register('shop_address')}
                    className={`${inputCls(!!errors.shop_address)} min-h-24 resize-none`}
                    placeholder="123 Main St, Miami, FL 33101, USA"
                  />
                </Field>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {updateMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <span className="text-lg">✓</span>
            Settings updated successfully
          </div>
        )}
      </div>
    </Layout>
  );
}
