import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout';
import CustomerCard from '../components/CustomerCard';
import { CustomersSkeleton } from '../components/ui/Skeletons';
import Alert from '../components/ui/Alert';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';
import { CustomerDetail } from '../components/CustomerDetail';
import { PaymentModal } from '../components/PaymentModal';
import { CustomerActionsDropdown } from '../components/CustomerActionsDropdown';
import { CreateCustomerModal } from '../components/CreateCustomerModal';
import { customersService } from '../services/customers.service';
import { vehiclesService } from '../services/vehicles.service';
import { paymentsService } from '../services/payments.service';
import type { Customer } from '../types';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { useVehicleForm } from '../hooks/useVehicleForm';
import { usePaymentForm } from '../hooks/usePaymentForm';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { useDropdown } from '../hooks/useDropdown';
import { useModalState } from '../hooks/useModalState';
import { filterCustomers } from '../utils/customerUtils';
import { validateVehiclePlates, handleCreateCustomerError } from '../utils/vehicleValidation';

export default function Customers() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Hooks
  const { form: customerForm, formatPhoneNumber } = useCustomerForm();
  const vehicleFormHook = useVehicleForm();
  const paymentForm = usePaymentForm(0);
  const {
    vehicles,
    customerWorkOrders,
    customerBalance,
    loadingDetail,
    loadCustomerDetail,
  } = useCustomerDetail();
  const { activeDropdown, dropdownPos, openDropdown, closeDropdown } = useDropdown();
  const {
    showCreateModal,
    setShowCreateModal,
    showDetailModal,
    setShowDetailModal,
    showPaymentModal,
    setShowPaymentModal,
    showWorkOrderModal,
    setShowWorkOrderModal,
    alert,
    setAlert,
    confirmDialog,
    setConfirmDialog,
  } = useModalState();

  // Queries
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.findAll(),
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (values: any) => {
      await validateVehiclePlates(
        vehicleFormHook.vehiclesToAdd,
        vehicleFormHook.existingVehicles,
        editingCustomer
      );

      const customer = await (editingCustomer
        ? customersService.update(editingCustomer.id, values)
        : customersService.create(values));

      for (const vehicle of vehicleFormHook.existingVehicles) {
        await vehiclesService.update(vehicle.id, {
          plate: vehicle.plate,
          model: vehicle.model,
          description: vehicle.description || '',
        });
      }

      if (vehicleFormHook.vehiclesToAdd.length > 0) {
        for (const vehicle of vehicleFormHook.vehiclesToAdd) {
          await vehiclesService.create({
            customer_id: customer.id,
            plate: vehicle.plate,
            model: vehicle.model,
            description: vehicle.description || '',
          });
        }
      }

      return customer;
    },
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowCreateModal(false);
      customerForm.reset();
      vehicleFormHook.reset();
      setEditingCustomer(null);

      setAlert({
        type: 'success',
        title: editingCustomer ? 'Customer Updated' : 'Customer Created',
        message: `${customer.name} has been ${editingCustomer ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error) => {
      const message = handleCreateCustomerError(error);
      setAlert({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setConfirmDialog(null);
      setShowDetailModal(false);
      closeDropdown();
      setAlert({
        type: 'success',
        title: 'Customer Deleted',
        message: 'Customer has been deleted successfully.',
      });
    },
    onError: (error) => {
      setAlert({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete customer',
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedCustomer || customerWorkOrders.length === 0)
        throw new Error('No work order');
      return paymentsService.create(
        customerWorkOrders[0].id,
        values.amount,
        values.method,
        values.date
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowPaymentModal(false);
      paymentForm.reset();
      if (selectedCustomer) loadCustomerDetail(selectedCustomer);
    },
  });

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, searchQuery);
  }, [customers, searchQuery]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    customerForm.reset({ name: '', phone: '' });
    vehicleFormHook.reset();
    setShowCreateModal(true);
  };

  const handleOpenDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerDetail(customer);
    setShowDetailModal(true);
  };

  const handleOpenEditModal = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      customerForm.reset({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      });
      vehicleFormHook.setExistingVehicles(
        vehicles.map((v) => ({
          id: v.id,
          plate: v.plate,
          model: v.model,
          description: v.description,
        }))
      );
      vehicleFormHook.setVehiclesToAdd([]);
      vehicleFormHook.setEditingVehicle(null);
      setShowCreateModal(true);
      closeDropdown();
    }
  };

  const handleOpenDeleteConfirm = () => {
    if (selectedCustomer) {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Customer',
        message: `Are you sure you want to delete ${selectedCustomer.name}? This action cannot be undone.`,
        confirmText: 'Delete',
        isDangerous: true,
        onConfirm: () => {
          deleteCustomerMutation.mutate(selectedCustomer.id);
        },
      });
      closeDropdown();
    }
  };

  const handleOpenPaymentModal = () => {
    paymentForm.reset({
      amount: 0,
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    setShowPaymentModal(true);
    closeDropdown();
  };

  const handleCardAction = (e: React.MouseEvent, customer: Customer, buttonRef: HTMLButtonElement | null) => {
    e.stopPropagation();
    if (activeDropdown !== customer.id) {
      setSelectedCustomer(customer);
      openDropdown(customer.id, buttonRef);
    } else {
      closeDropdown();
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
          {t('customers.title')}
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={16} />
          {t('customers.new')}
        </button>
      </div>

      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search by name, phone, or plate..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {isLoading ? (
        <CustomersSkeleton />
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No customers found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer) => {
            let buttonRef: HTMLButtonElement | null = null;
            return (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onCardClick={() => handleOpenDetailModal(customer)}
                onActionClick={(e) => handleCardAction(e, customer, buttonRef)}
                onMoreClick={(ref) => {
                  buttonRef = ref;
                }}
              />
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <CustomerDetail
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customer={selectedCustomer}
        vehicles={vehicles}
        workOrders={customerWorkOrders}
        balance={customerBalance}
        isLoading={loadingDetail}
      />

      {/* Create/Edit Modal */}
      <CreateCustomerModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          vehicleFormHook.reset();
        }}
        customerForm={customerForm}
        vehicleForm={vehicleFormHook.form}
        vehiclesToAdd={vehicleFormHook.vehiclesToAdd}
        existingVehicles={vehicleFormHook.existingVehicles}
        editingVehicle={vehicleFormHook.editingVehicle}
        isEditing={!!editingCustomer}
        isLoading={createCustomerMutation.isPending}
        onSubmit={(data) => createCustomerMutation.mutate(data)}
        onAddVehicle={vehicleFormHook.addVehicle}
        onRemoveVehicle={vehicleFormHook.removeVehicle}
        onRemoveExistingVehicle={vehicleFormHook.removeExistingVehicle}
        onEditVehicle={vehicleFormHook.setEditingVehicle}
        onUpdateEditingVehicle={vehicleFormHook.updateEditingVehicle}
        onSaveEditingVehicle={vehicleFormHook.saveEditingVehicle}
        onFormatPhone={formatPhoneNumber}
        setVehiclesToAdd={vehicleFormHook.setVehiclesToAdd}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        form={paymentForm}
        balance={customerBalance}
        onSubmit={(data) => createPaymentMutation.mutate(data)}
        isLoading={createPaymentMutation.isPending}
      />

      {/* Work Order Modal */}
      <CreateWorkOrderModal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        customerId={selectedCustomer?.id}
      />

      {/* Actions Dropdown */}
      <CustomerActionsDropdown
        isOpen={!!activeDropdown}
        position={dropdownPos}
        onCreateWorkOrder={() => {
          setShowWorkOrderModal(true);
          closeDropdown();
        }}
        onRegisterPayment={handleOpenPaymentModal}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteConfirm}
      />

      {/* Alerts and Confirmations */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
          autoClose={true}
          autoCloseDuration={3000}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          isDangerous={confirmDialog.isDangerous}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isLoading={deleteCustomerMutation.isPending}
        />
      )}
    </Layout>
  );
}
