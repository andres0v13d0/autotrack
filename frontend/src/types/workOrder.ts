export type WorkOrderItemType = 'part' | 'labor';
export type PaymentMethod = 'cash' | 'card' | 'check' | 'other';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface WorkOrderItem {
  id: string;
  type: WorkOrderItemType;
  name: string;
  price: number;
  qty: number;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate: string;
  model: string;
  description?: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  description_needed: string;
  items: WorkOrderItem[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  created_at: string;
  vehicle?: Vehicle;
  // Derived fields (calculated on frontend from payments)
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'pending' | 'partial' | 'paid';
}

// Frontend mappers untuk compatibilidad dengan UI
export const mapWorkOrderToUI = (order: WorkOrder) => ({
  ...order,
  vehicleId: order.vehicle_id,
  descriptionNeeded: order.description_needed,
  createdAt: order.created_at,
});

export const mapWorkOrderItemToUI = (item: WorkOrderItem) => item;

