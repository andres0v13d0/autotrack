import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, Truck, X, Edit2, Check } from 'lucide-react';
import Modal from './ui/Modal';
import Field, { inputCls } from './ui/Field';
import type { ExistingVehicle, VehicleFormData } from '../hooks/useVehicleForm';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerForm: UseFormReturn<any>;
  vehicleForm: UseFormReturn<any>;
  vehiclesToAdd: VehicleFormData[];
  existingVehicles: ExistingVehicle[];
  editingVehicle: ExistingVehicle | null;
  isEditing: boolean;
  isLoading?: boolean;
  onSubmit: (data: any) => void;
  onAddVehicle: () => void;
  onRemoveVehicle: (index: number) => void;
  onRemoveExistingVehicle: (id: string) => void;
  onEditVehicle: (vehicle: ExistingVehicle | null) => void;
  onUpdateEditingVehicle: (updates: Partial<ExistingVehicle>) => void;
  onSaveEditingVehicle: () => void;
  onFormatPhone: (value: string) => string;
  setVehiclesToAdd: (vehicles: VehicleFormData[]) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  customerForm,
  vehicleForm,
  vehiclesToAdd,
  existingVehicles,
  editingVehicle,
  isEditing,
  isLoading = false,
  onSubmit,
  onAddVehicle,
  onRemoveVehicle,
  onRemoveExistingVehicle,
  onEditVehicle,
  onUpdateEditingVehicle,
  onSaveEditingVehicle,
  onFormatPhone,
  setVehiclesToAdd,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      title={isEditing ? 'Edit Customer' : 'New Customer'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={customerForm.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Info Section */}
        <div>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#0f1f3d' }}>
            Customer Information
          </h3>
          <div className="space-y-4">
            <Field label="Full Name" error={customerForm.formState.errors.name?.message as string}>
              <input
                {...customerForm.register('name')}
                className={`${inputCls(!!customerForm.formState.errors.name)} text-base px-4 py-3 rounded-lg`}
                placeholder="John Doe"
              />
            </Field>
            <Field label="Phone Number" error={customerForm.formState.errors.phone?.message as string}>
              <input
                {...customerForm.register('phone')}
                className={`${inputCls(!!customerForm.formState.errors.phone)} text-base px-4 py-3 rounded-lg`}
                placeholder="(305) 555-1234"
                onChange={(e) => {
                  const formatted = onFormatPhone(e.target.value);
                  customerForm.setValue('phone', formatted);
                }}
              />
            </Field>
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>
              <Truck size={18} className="inline mr-2" style={{ color: '#f97316' }} />
              {isEditing ? 'Vehicles & Management' : 'Add Vehicles (Optional)'}
            </h3>
            {(vehiclesToAdd.length > 0 || (isEditing && existingVehicles.length > 0)) && (
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse"
                style={{ backgroundColor: '#f97316' }}
              >
                {(existingVehicles.length || 0) + vehiclesToAdd.length} total
              </span>
            )}
          </div>

          {/* Existing Vehicles - Only show when editing */}
          {isEditing && existingVehicles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Registered Vehicles
              </p>
              <div className="grid grid-cols-2 gap-3">
                {existingVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-400"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck size={16} style={{ color: '#10b981' }} />
                        <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>
                          {vehicle.plate}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onEditVehicle(editingVehicle?.id === vehicle.id ? null : vehicle)
                          }
                          className="p-1.5 rounded hover:bg-green-200 transition-colors cursor-pointer"
                          title={editingVehicle?.id === vehicle.id ? 'Close' : 'Edit'}
                        >
                          {editingVehicle?.id === vehicle.id ? (
                            <X size={14} style={{ color: '#ef4444' }} />
                          ) : (
                            <Edit2 size={14} style={{ color: '#10b981' }} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveExistingVehicle(vehicle.id)}
                          className="text-xl text-red-500 hover:text-red-700 transition-colors cursor-pointer font-light leading-none"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{vehicle.model}</p>
                    {vehicle.description && (
                      <p className="text-xs text-gray-500 italic">{vehicle.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add vehicle form OR Edit form */}
          {editingVehicle ? (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-orange-900 uppercase tracking-wide">
                  Edit {editingVehicle.plate}
                </p>
                <button
                  type="button"
                  onClick={() => onEditVehicle(null)}
                  className="p-1 hover:bg-orange-200 rounded transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} style={{ color: '#ef4444' }} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="License Plate">
                  <input
                    type="text"
                    value={editingVehicle.plate}
                    onChange={(e) => onUpdateEditingVehicle({ plate: e.target.value })}
                    className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="ABC-1234"
                  />
                </Field>
                <Field label="Model">
                  <input
                    type="text"
                    value={editingVehicle.model}
                    onChange={(e) => onUpdateEditingVehicle({ model: e.target.value })}
                    className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="2020 Toyota Camry"
                  />
                </Field>
              </div>
              <Field label="Description">
                <input
                  type="text"
                  value={editingVehicle.description || ''}
                  onChange={(e) => onUpdateEditingVehicle({ description: e.target.value })}
                  className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                  placeholder="e.g., Red, has dent on left side"
                />
              </Field>
              <button
                type="button"
                onClick={onSaveEditingVehicle}
                className="w-full px-3 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: '#10b981' }}
              >
                <Check size={16} />
                Done
              </button>
            </div>
          ) : (
            <>
              {/* New Vehicles List */}
              {vehiclesToAdd.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">
                    New Vehicles to Add
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {vehiclesToAdd.map((vehicle, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-400"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Truck size={16} style={{ color: '#3b82f6' }} />
                            <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>
                              {vehicle.plate}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onEditVehicle({ ...vehicle, id: `new-${index}` });
                                setVehiclesToAdd(vehiclesToAdd.filter((_, i) => i !== index));
                              }}
                              className="p-1.5 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={14} style={{ color: '#3b82f6' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveVehicle(index)}
                              className="text-xl text-red-500 hover:text-red-700 transition-colors cursor-pointer font-light leading-none"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{vehicle.model}</p>
                        {vehicle.description && (
                          <p className="text-xs text-gray-500 italic">{vehicle.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add vehicle form */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 space-y-4">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Add a new vehicle
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="License Plate" error={vehicleForm.formState.errors.plate?.message as string}>
                    <input
                      {...vehicleForm.register('plate')}
                      className={`${inputCls(!!vehicleForm.formState.errors.plate)} text-sm px-3 py-2 rounded-lg`}
                      placeholder="ABC-1234"
                    />
                  </Field>
                  <Field label="Model" error={vehicleForm.formState.errors.model?.message as string}>
                    <input
                      {...vehicleForm.register('model')}
                      className={`${inputCls(!!vehicleForm.formState.errors.model)} text-sm px-3 py-2 rounded-lg`}
                      placeholder="2020 Toyota Camry"
                    />
                  </Field>
                </div>
                <Field label="Description (optional)" error={vehicleForm.formState.errors.description?.message as string}>
                  <input
                    {...vehicleForm.register('description')}
                    className={inputCls(!!vehicleForm.formState.errors.description)}
                    placeholder="e.g., Red, has dent on left side"
                  />
                </Field>
                <button
                  type="button"
                  onClick={onAddVehicle}
                  className="w-full px-4 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#f97316' }}
                >
                  <Plus size={16} />
                  Add Vehicle
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
            style={{ backgroundColor: '#f97316' }}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
