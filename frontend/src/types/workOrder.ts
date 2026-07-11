export type WorkOrderItemType = 'part' | 'labor';

export type PaymentStatus = 'paid' | 'credit' | 'partial' | 'pending';

export type WorkOrderStatus = 'open' | 'in_progress' | 'completed';

export interface WorkOrderItem {
  id: string;
  type: WorkOrderItemType;
  name: string;
  price: number;
  qty: number;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  descriptionNeeded: string;
  status: WorkOrderStatus;
  paymentStatus: PaymentStatus;
  items: WorkOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}
