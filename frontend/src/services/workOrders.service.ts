/**
 * MOCK SERVICE — Simulates API calls with in-memory data.
 *
 * When the backend is ready, replace each function body with the
 * corresponding Axios call. The function signatures MUST NOT change.
 *
 * ─── Backend contract (Fase 3) ────────────────────────────────────────────
 *
 * GET    /work-orders?vehicleId=:id
 *        → WorkOrder[]
 *
 * GET    /work-orders/:id
 *        → WorkOrder
 *
 * POST   /work-orders
 *        body: { vehicle_id: string, description_needed: string }
 *        → WorkOrder
 *
 * POST   /work-orders/:id/items
 *        body: { type: 'part'|'labor', name: string, price: number, qty: number }
 *        → WorkOrder   (backend recalculates subtotal/tax/total)
 *
 * DELETE /work-orders/:id/items/:itemId
 *        → WorkOrder   (backend recalculates subtotal/tax/total)
 *
 * PATCH  /work-orders/:id/payment-status
 *        body: { payment_status: PaymentStatus }
 *        → WorkOrder
 *
 * Auth:  Bearer JWT required on all endpoints.
 * Roles: front_desk & admin can create/edit; technician can add items only.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { TAX_RATE } from '../config/constants';
import type { WorkOrder, WorkOrderItem, PaymentStatus, WorkOrderItemType } from '../types/workOrder';

// ── fake DB ──────────────────────────────────────────────────────────────────
const db: WorkOrder[] = [
  {
    id: 'wo1',
    vehicleId: 'v1',
    descriptionNeeded: 'Rear brake replacement',
    status: 'completed',
    paymentStatus: 'paid',
    items: [
      { id: 'i1', type: 'part',  name: 'Brake pads (rear)', price: 45.00, qty: 1 },
      { id: 'i2', type: 'part',  name: 'Brake rotor (rear)', price: 80.00, qty: 2 },
      { id: 'i3', type: 'labor', name: 'Brake labor',        price: 120.00, qty: 1 },
    ],
    subtotal: 325.00,
    tax: 28.03,
    total: 353.03,
    createdAt: '2025-05-10T10:00:00Z',
  },
  {
    id: 'wo2',
    vehicleId: 'v2',
    descriptionNeeded: 'Oil change + tire rotation',
    status: 'in_progress',
    paymentStatus: 'pending',
    items: [
      { id: 'i4', type: 'part',  name: 'Engine oil 5W-30', price: 32.00, qty: 1 },
      { id: 'i5', type: 'labor', name: 'Oil change labor',  price: 40.00, qty: 1 },
    ],
    subtotal: 72.00,
    tax: 6.21,
    total: 78.21,
    createdAt: '2025-06-01T09:00:00Z',
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function delay<T>(value: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), 300));
}

function recalculate(order: WorkOrder): WorkOrder {
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  return { ...order, subtotal: parseFloat(subtotal.toFixed(2)), tax, total };
}

function findOrThrow(id: string): WorkOrder {
  const order = db.find((o) => o.id === id);
  if (!order) throw new Error(`Work order ${id} not found`);
  return order;
}

function upsert(order: WorkOrder): WorkOrder {
  const idx = db.findIndex((o) => o.id === order.id);
  if (idx >= 0) db[idx] = order;
  else db.push(order);
  return order;
}

// ── public API ────────────────────────────────────────────────────────────────
export const workOrdersService = {
  /** GET /work-orders?vehicleId=:id */
  getByVehicle: (vehicleId: string): Promise<WorkOrder[]> =>
    delay(db.filter((o) => o.vehicleId === vehicleId)),

  /** GET /work-orders/:id */
  getOne: (id: string): Promise<WorkOrder> =>
    delay(findOrThrow(id)),

  /** POST /work-orders */
  create: (vehicleId: string, descriptionNeeded: string): Promise<WorkOrder> => {
    const order: WorkOrder = {
      id: `wo-${Date.now()}`,
      vehicleId,
      descriptionNeeded,
      status: 'open',
      paymentStatus: 'pending',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date().toISOString(),
    };
    return delay(upsert(order));
  },

  /** POST /work-orders/:id/items */
  addItem: (
    workOrderId: string,
    item: { type: WorkOrderItemType; name: string; price: number; qty: number },
  ): Promise<WorkOrder> => {
    const order = findOrThrow(workOrderId);
    const newItem: WorkOrderItem = { id: `item-${Date.now()}`, ...item };
    const updated = recalculate({ ...order, items: [...order.items, newItem] });
    return delay(upsert(updated));
  },

  /** DELETE /work-orders/:id/items/:itemId */
  removeItem: (workOrderId: string, itemId: string): Promise<WorkOrder> => {
    const order = findOrThrow(workOrderId);
    const updated = recalculate({ ...order, items: order.items.filter((i) => i.id !== itemId) });
    return delay(upsert(updated));
  },

  /** PATCH /work-orders/:id/payment-status */
  updatePaymentStatus: (workOrderId: string, status: PaymentStatus): Promise<WorkOrder> => {
    const order = findOrThrow(workOrderId);
    const updated = { ...order, paymentStatus: status };
    return delay(upsert(updated));
  },
};
