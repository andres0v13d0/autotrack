import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table';
import { workOrdersService } from '../services/workOrders.service';
import { vehiclesService } from '../services/vehicles.service';
import { customersService } from '../services/customers.service';
import type { WorkOrder } from '../types/workOrder';
import type { Vehicle } from '../types';
import { Eye, Plus } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Field, { inputCls } from '../components/ui/Field';

const createOrderSchema = z.object({
  customer_phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
  vehicle_id: z.string().min(1, 'Select a vehicle'),
  description_needed: z.string().min(3, 'Description required'),
});
type CreateOrderValues = z.infer<typeof createOrderSchema>;

export default function WorkOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      try {
        return await workOrdersService.findAll();
      } catch {
        return [];
      }
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateOrderValues) => {
      return workOrdersService.create(values.vehicle_id, values.description_needed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workOrders'] });
      setShowModal(false);
      reset();
    },
  });

  const handleCustomerChange = async (phone: string) => {
    if (phone.length >= 10) {
      setLoadingVehicles(true);
      try {
        const allCustomers = await customersService.findAll();
        const customer = allCustomers.find(c => c.phone === phone);
        if (customer) {
          const customerVehicles = await vehiclesService.findByCustomer(customer.id);
          setVehicles(customerVehicles);
        }
      } finally {
        setLoadingVehicles(false);
      }
    }
  };

  const onSubmit = (values: CreateOrderValues) => {
    createMutation.mutate(values);
  };

  const columns: TableColumn<WorkOrder>[] = [
    {
      key: 'id',
      label: 'Order #',
      width: '12%',
      render: (value: string) => `#${value.slice(0, 8)}`,
    },
    {
      key: 'vehicle',
      label: t('vehicles.plate'),
      width: '15%',
      render: (_value: unknown, row: WorkOrder) => row.vehicle?.plate || 'N/A',
    },
    {
      key: 'vehicle',
      label: t('vehicles.model'),
      width: '18%',
      render: (_value: unknown, row: WorkOrder) => row.vehicle?.model || 'N/A',
    },
    {
      key: 'description_needed',
      label: 'Description',
      width: '20%',
      render: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? `${value.substring(0, 30)}...` : value;
      },
    },
    {
      key: 'total',
      label: 'Total',
      width: '12%',
      render: (value: unknown) => {
        if (typeof value !== 'number' || isNaN(value)) return '$0.00';
        return `$${value.toFixed(2)}`;
      },
    },
    {
      key: 'created_at',
      label: t('customers.createdAt'),
      width: '13%',
      render: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return 'N/A';
        }
      },
    },
    {
      key: 'id',
      label: 'Action',
      width: '10%',
      render: (_value: string, row: WorkOrder) => (
        <button
          onClick={() => navigate(`/vehicles/${row.vehicle_id}/work-orders/${row.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
        >
          <Eye size={14} />
          View
        </button>
      ),
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
          {t('nav.workOrders')}
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      <Table<WorkOrder>
        columns={columns}
        data={workOrders}
        isLoading={isLoading}
        emptyMessage="No work orders found"
        rowKey="id"
      />

      {/* Create Order Modal */}
      {showModal && (
        <Modal 
          title="New Work Order"
          onClose={() => {
            setShowModal(false);
            reset();
            setVehicles([]);
          }}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Customer Phone" error={errors.customer_phone?.message}>
              <input
                {...register('customer_phone')}
                className={inputCls(!!errors.customer_phone)}
                placeholder="(305) 555-1234"
                onChange={(e) => {
                  handleCustomerChange(e.target.value);
                }}
              />
            </Field>

            <Field label={t('vehicles.plate')} error={errors.vehicle_id?.message}>
              <select
                {...register('vehicle_id')}
                className={inputCls(!!errors.vehicle_id)}
                disabled={loadingVehicles || vehicles.length === 0}
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.model}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description" error={errors.description_needed?.message}>
              <textarea
                {...register('description_needed')}
                className={`${inputCls(!!errors.description_needed)} min-h-20 resize-none`}
                placeholder="What needs to be done?"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  reset();
                  setVehicles([]);
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                {createMutation.isPending ? '...' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
