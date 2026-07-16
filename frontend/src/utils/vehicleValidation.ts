import { vehiclesService } from '../services/vehicles.service';
import type { Customer } from '../types';
import type { ExistingVehicle, VehicleFormData } from '../hooks/useVehicleForm';

export const validateVehiclePlates = async (
  vehiclesToAdd: VehicleFormData[],
  existingVehicles: ExistingVehicle[],
  editingCustomer: Customer | null
) => {
  const allVehicles = await vehiclesService.findAll();

  const vehiclesToValidate = [...vehiclesToAdd];
  for (const vehicle of existingVehicles) {
    vehiclesToValidate.push(vehicle);
  }

  for (const vehicle of vehiclesToValidate) {
    const existingPlate = allVehicles.find(
      v => v.plate.toUpperCase() === vehicle.plate.toUpperCase()
    );
    if (existingPlate) {
      if (editingCustomer && existingPlate.customer_id === editingCustomer.id) {
        continue;
      }
      throw new Error(
        `This plate (${vehicle.plate}) is already registered and belongs to another customer.`
      );
    }
  }
};

export const handleCreateCustomerError = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('plate') && errorMsg.includes('already registered')) {
      const match = error.message.match(/\(([^)]+)\)/);
      const plate = match ? match[1] : 'this plate';
      return `${plate} is already registered to another customer. Please use a different plate.`;
    } else if (errorMsg.includes('plate already')) {
      return 'This plate is already registered in the system. Please use a different plate.';
    } else if (errorMsg.includes('conflict')) {
      return 'This plate is already registered in the system. Please use a different plate.';
    } else if (errorMsg.includes('phone')) {
      return 'This phone number is already registered.';
    } else {
      return error.message;
    }
  }
  return 'An error occurred';
};
