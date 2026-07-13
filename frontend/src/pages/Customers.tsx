import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Eye, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import type { TableColumn, TableAction } from '../components/ui/Table';
import Field, { inputCls } from '../components/ui/Field';
import Modal from '../components/ui/Modal';
import { customersService } from '../services/customers.service';
import { vehiclesService } from '../services/vehicles.service';
import type { Customer, Vehicle } from '../types';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const vehicleSchema = z.object({
  plate: z.string().min(2),
  model: z.string().min(2),
  description: z.string().optional(),
});
type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function Customers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<Vehicle | null>(null);

  const { register: registerCustomer, handleSubmit: handleCustomerSubmit, reset: resetCustomer, formState: { errors: customerErrors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const { register: registerVehicle, handleSubmit: handleVehicleSubmit, reset: resetVehicle, formState: { errors: vehicleErrors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.findAll(),
  });

  // Create/Update customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (values: CustomerFormValues) => 
      editingCustomer 
        ? customersService.update(editingCustomer.id, values)
        : customersService.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowCustomerModal(false);
      resetCustomer();
      setEditingCustomer(null);
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setDeleteConfirm(null);
    },
  });

  // Create/Update vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: (values: VehicleFormValues) => {
      if (!selectedCustomer) throw new Error('No customer selected');
      return editingVehicle
        ? vehiclesService.update(editingVehicle.id, values)
        : vehiclesService.create({ ...values, customer_id: selectedCustomer.id });
    },
    onSuccess: () => {
      loadVehicles();
      resetVehicle();
      setEditingVehicle(null);
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => vehiclesService.remove(id),
    onSuccess: () => {
      loadVehicles();
      setDeleteVehicleConfirm(null);
    },
  });

  const loadVehicles = async () => {
    if (!selectedCustomer) return;
    setVehicleLoading(true);
    try {
      const data = await vehiclesService.findByCustomer(selectedCustomer.id);
      setVehicles(data);
    } finally {
      setVehicleLoading(false);
    }
  };

  const openCreateCustomer = () => {
    setEditingCustomer(null);
    resetCustomer({ name: '', phone: '' });
    setShowCustomerModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    resetCustomer({ name: customer.name, phone: customer.phone });
    setShowCustomerModal(true);
  };

  const openVehiclesModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingVehicle(null);
    resetVehicle({ plate: '', model: '', description: '' });
    setShowVehiclesModal(true);
    await loadVehicles();
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    resetVehicle({ plate: vehicle.plate, model: vehicle.model, description: vehicle.description });
  };

  const onCustomerSubmit = (values: CustomerFormValues) => {
    createCustomerMutation.mutate(values);
  };

  const onVehicleSubmit = (values: VehicleFormValues) => {
    createVehicleMutation.mutate(values);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteConfirm(customer);
  };

  const confirmDeleteCustomer = () => {
    if (deleteConfirm) {
      deleteCustomerMutation.mutate(deleteConfirm.id);
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setDeleteVehicleConfirm(vehicle);
  };

  const confirmDeleteVehicle = () => {
    if (deleteVehicleConfirm) {
      deleteVehicleMutation.mutate(deleteVehicleConfirm.id);
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name',
      label: t('customers.name'),
      width: '30%',
    },
    {
      key: 'phone',
      label: t('customers.phone'),
      width: '25%',
    },
    {
      key: 'created_at',
      label: t('customers.createdAt'),
      width: '20%',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'id',
      label: t('customers.vehicles'),
      width: '25%',
      render: (_value: string, row: Customer) => (
        <button
          onClick={() => openVehiclesModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
        >
          <Eye size={14} />
          View
        </button>
      ),
    },
  ];

  const actions: TableAction<Customer>[] = [
    {
      label: 'Edit',
      icon: <Edit2 size={16} />,
      onClick: openEditCustomer,
      variant: 'secondary',
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: handleDeleteCustomer,
      variant: 'danger',
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
          {t('customers.title')}
        </h1>
        <button
          onClick={openCreateCustomer}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={16} />
          {t('customers.new')}
        </button>
      </div>

      <Table<Customer>
        columns={columns}
        data={customers}
        actions={actions}
        isLoading={isLoading}
        emptyMessage={t('customers.empty') || 'No customers found'}
        rowKey="id"
      />

      {/* Create / Edit Customer Modal */}
      {showCustomerModal && (
        <Modal 
          title={editingCustomer ? t('customers.edit') : t('customers.new')} 
          onClose={() => setShowCustomerModal(false)}
        >
          <form onSubmit={handleCustomerSubmit(onCustomerSubmit)} className="space-y-4">
            <Field label={t('customers.name')} error={customerErrors.name?.message}>
              <input {...registerCustomer('name')} className={inputCls(!!customerErrors.name)} placeholder="John Doe" />
            </Field>
            <Field label={t('customers.phone')} error={customerErrors.phone?.message}>
              <input {...registerCustomer('phone')} className={inputCls(!!customerErrors.phone)} placeholder="(305) 555-1234" />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                {createCustomerMutation.isPending ? '...' : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Customer Confirm */}
      {deleteConfirm && (
        <Modal title={t('common.confirmDelete')} onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-600 text-sm mb-5">
            {t('common.deleteWarning')} <strong>{deleteConfirm.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDeleteCustomer}
              disabled={deleteCustomerMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 cursor-pointer transition-colors"
            >
              {deleteCustomerMutation.isPending ? '...' : t('common.delete')}
            </button>
          </div>
        </Modal>
      )}

      {/* Vehicles Modal */}
      {showVehiclesModal && selectedCustomer && (
        <Modal 
          title={`${selectedCustomer.name} - ${t('customers.vehicles')}`}
          onClose={() => setShowVehiclesModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            {/* Add Vehicle Form */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#0f1f3d' }}>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <form onSubmit={handleVehicleSubmit(onVehicleSubmit)} className="space-y-3">
                <Field label="License Plate" error={vehicleErrors.plate?.message}>
                  <input {...registerVehicle('plate')} className={inputCls(!!vehicleErrors.plate)} placeholder="ABC-1234" />
                </Field>
                <Field label="Model" error={vehicleErrors.model?.message}>
                  <input {...registerVehicle('model')} className={inputCls(!!vehicleErrors.model)} placeholder="Toyota Camry 2020" />
                </Field>
                <Field label="Description (optional)" error={vehicleErrors.description?.message}>
                  <input {...registerVehicle('description')} className={inputCls(!!vehicleErrors.description)} placeholder="Regular maintenance" />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  {editingVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicle(null);
                        resetVehicle({ plate: '', model: '', description: '' });
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={createVehicleMutation.isPending}
                    className="px-3 py-1.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity inline-flex items-center gap-2"
                    style={{ backgroundColor: '#f97316' }}
                  >
                    <Plus size={14} />
                    {createVehicleMutation.isPending ? '...' : editingVehicle ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>

            {/* Vehicles List */}
            <div>
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#0f1f3d' }}>
                Vehicles ({vehicles.length})
              </h3>
              {vehicleLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-gray-500">No vehicles registered yet</p>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{vehicle.plate}</p>
                        <p className="text-xs text-gray-600">{vehicle.model}</p>
                        {vehicle.description && <p className="text-xs text-gray-500">{vehicle.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditVehicle(vehicle)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Edit2 size={14} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              onClick={() => setShowVehiclesModal(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Vehicle Confirm */}
      {deleteVehicleConfirm && (
        <Modal title={t('common.confirmDelete')} onClose={() => setDeleteVehicleConfirm(null)}>
          <p className="text-gray-600 text-sm mb-5">
            Delete vehicle <strong>{deleteVehicleConfirm.plate}</strong>? {t('common.deleteWarning')}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteVehicleConfirm(null)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDeleteVehicle}
              disabled={deleteVehicleMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 cursor-pointer transition-colors"
            >
              {deleteVehicleMutation.isPending ? '...' : t('common.delete')}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
