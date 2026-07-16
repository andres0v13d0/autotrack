import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './ui/Modal';
import Field, { inputCls } from './ui/Field';
import { customersService } from '../services/customers.service';
import { vehiclesService } from '../services/vehicles.service';
import { workOrdersService } from '../services/workOrders.service';
import type { Vehicle } from '../types';
import { AlertCircle } from 'lucide-react';

const createOrderSchema = z.object({
  vehicle_id: z.string().min(1, 'Select a vehicle'),
  description_needed: z.string().min(3, 'Description required'),
});

type CreateOrderValues = z.infer<typeof createOrderSchema>;

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  onOpenExistingOrder?: (workOrderId: string) => void;
}

export default function CreateWorkOrderModal({ isOpen, onClose, customerId, onOpenExistingOrder }: CreateWorkOrderModalProps) {
  if (!isOpen) return null;
  const qc = useQueryClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showExistingOrderDialog, setShowExistingOrderDialog] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
  });

  const vehicleIdValue = watch('vehicle_id');

  useEffect(() => {
    if (customerId) {
      loadCustomerAndVehicles(customerId);
    } else {
      resetForm();
    }
  }, [customerId, isOpen]);

  // Check for open orders when vehicle changes
  useEffect(() => {
    if (vehicleIdValue) {
      checkForOpenOrders(vehicleIdValue);
    }
  }, [vehicleIdValue]);

  const loadCustomerAndVehicles = async (cId: string) => {
    try {
      setLoadingVehicles(true);
      const allCustomers = await customersService.findAll();
      const customer = allCustomers.find(c => c.id === cId);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearch(`${customer.name} (${customer.phone})`);
        const customerVehicles = await vehiclesService.findByCustomer(cId);
        setVehicles(customerVehicles);
      }
    } finally {
      setLoadingVehicles(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (values: CreateOrderValues) => {
      return workOrdersService.create(values.vehicle_id, values.description_needed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workOrders'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      alert(`Error creating work order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const checkForOpenOrders = async (vehicleId: string) => {
    try {
      const orders = await workOrdersService.getByVehicle(vehicleId);
      const openOrder = orders.find(o => o.delivery_status === 'new' || o.delivery_status === 'in_progress');
      if (openOrder) {
        setExistingOrder(openOrder);
        setShowExistingOrderDialog(true);
      }
    } catch (error) {
      console.error('Error checking for open orders:', error);
    }
  };

  const handleSearchCustomer = async (query: string) => {
    setCustomerSearch(query);
    setShowCustomerDropdown(true);

    if (query.length < 1) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const allCustomers = await customersService.findAll();
      const filtered = allCustomers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      );
      setCustomerSuggestions(filtered);
    } catch {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.name} (${customer.phone})`);
    setShowCustomerDropdown(false);
    setLoadingVehicles(true);

    try {
      const customerVehicles = await vehiclesService.findByCustomer(customer.id);
      setVehicles(customerVehicles);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleResetCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setVehicles([]);
    setCustomerSuggestions([]);
    setValue('vehicle_id', '');
  };

  const resetForm = () => {
    reset();
    handleResetCustomer();
  };

  return (
    <Modal
      title="New Work Order"
      onClose={() => {
        resetForm();
        onClose();
      }}
      size="md"
    >
      <form
        onSubmit={handleSubmit((v) => {
          if (!selectedCustomer) {
            alert('Please select a customer');
            return;
          }
          createMutation.mutate(v);
        })}
        className="space-y-4"
      >
        {/* Customer Search */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-900">Customer</label>
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => handleResetCustomer()}
                className="text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {!selectedCustomer ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={customerSearch}
                onChange={(e) => handleSearchCustomer(e.target.value)}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-4 py-3 rounded-lg border-2 border-red-300 focus:outline-none focus:border-red-500 text-base"
              />
              <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <div className="w-1 h-1 bg-red-600 rounded-full" />
                Please select a customer
              </div>

              {showCustomerDropdown && customerSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-600">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}

              {showCustomerDropdown && customerSearch.length > 0 && customerSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4 text-center text-sm text-slate-600">
                  No customers found
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="font-semibold text-green-900">{selectedCustomer.name}</div>
              <div className="text-sm text-green-700">{selectedCustomer.phone}</div>
            </div>
          )}
        </div>

        {/* Vehicle Select */}
        <Field label="Vehicle" error={errors.vehicle_id?.message}>
          <select
            {...register('vehicle_id')}
            className={inputCls(!!errors.vehicle_id || (selectedCustomer && vehicles.length === 0))}
            disabled={!selectedCustomer || loadingVehicles || vehicles.length === 0}
          >
            <option value="">
              {!selectedCustomer
                ? 'Select a customer first'
                : loadingVehicles
                  ? 'Loading vehicles...'
                  : vehicles.length === 0
                    ? 'No vehicles found'
                    : 'Select a vehicle'}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} - {v.model}
              </option>
            ))}
          </select>
        </Field>

        {/* Description */}
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
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Cancel
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

      {/* Existing Order Dialog */}
      {showExistingOrderDialog && existingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Open Work Order Found</h3>
            </div>
            
            <p className="text-sm text-slate-600">
              This vehicle already has an open work order <strong>#{existingOrder.order_number}</strong>. Would you like to add more work items to this existing order instead of creating a new one?
            </p>

            <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-600"><strong>Status:</strong> {existingOrder.delivery_status.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="text-xs text-slate-600"><strong>Items:</strong> {existingOrder.items?.length || 0}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExistingOrderDialog(false)}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
              >
                Create New Order
              </button>
              <button
                onClick={() => {
                  setShowExistingOrderDialog(false);
                  onClose();
                  if (onOpenExistingOrder) {
                    onOpenExistingOrder(existingOrder.id);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#10b981' }}
              >
                Open Existing Order
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
