import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const vehicleSchema = z.object({
  plate: z.string().min(1, 'Plate is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type ExistingVehicle = VehicleFormData & { id: string };

export const useVehicleForm = () => {
  const form = useForm({ resolver: zodResolver(vehicleSchema) });
  const [vehiclesToAdd, setVehiclesToAdd] = useState<VehicleFormData[]>([]);
  const [existingVehicles, setExistingVehicles] = useState<ExistingVehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<ExistingVehicle | null>(null);

  const addVehicle = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const data = form.getValues();
      setVehiclesToAdd([...vehiclesToAdd, data]);
      form.reset({ plate: '', model: '', description: '' });
    }
  };

  const removeVehicle = (index: number) => {
    setVehiclesToAdd(vehiclesToAdd.filter((_, i) => i !== index));
  };

  const removeExistingVehicle = (id: string) => {
    setExistingVehicles(existingVehicles.filter(v => v.id !== id));
  };

  const updateEditingVehicle = (updates: Partial<ExistingVehicle>) => {
    if (editingVehicle) {
      setEditingVehicle({ ...editingVehicle, ...updates });
    }
  };

  const saveEditingVehicle = () => {
    if (!editingVehicle) return;
    
    if (editingVehicle.id?.toString().startsWith('new-')) {
      const index = parseInt(editingVehicle.id.split('-')[1]);
      const updatedVehicle = {
        plate: editingVehicle.plate,
        model: editingVehicle.model,
        description: editingVehicle.description,
      };
      const newList = [...vehiclesToAdd];
      newList[index] = updatedVehicle;
      setVehiclesToAdd(newList);
    } else {
      setExistingVehicles(existingVehicles.map(v => 
        v.id === editingVehicle.id ? editingVehicle : v
      ));
    }
    setEditingVehicle(null);
  };

  const reset = () => {
    setVehiclesToAdd([]);
    setExistingVehicles([]);
    setEditingVehicle(null);
    form.reset({ plate: '', model: '', description: '' });
  };

  return {
    form,
    vehiclesToAdd,
    existingVehicles,
    editingVehicle,
    setEditingVehicle,
    addVehicle,
    removeVehicle,
    removeExistingVehicle,
    updateEditingVehicle,
    saveEditingVehicle,
    setVehiclesToAdd,
    setExistingVehicles,
    reset,
  };
};
