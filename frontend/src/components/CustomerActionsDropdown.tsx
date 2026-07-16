import { createPortal } from 'react-dom';

interface CustomerActionsDropdownProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onCreateWorkOrder: () => void;
  onRegisterPayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomerActionsDropdown = ({
  isOpen,
  position,
  onCreateWorkOrder,
  onRegisterPayment,
  onEdit,
  onDelete,
}: CustomerActionsDropdownProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 z-50"
      onClick={(e) => e.stopPropagation()}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '200px',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateWorkOrder();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors border-b border-gray-100 cursor-pointer font-medium"
      >
        Create Work Order
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRegisterPayment();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors border-b border-gray-100 cursor-pointer font-medium"
      >
        Register Payment
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors border-b border-gray-100 cursor-pointer font-medium"
      >
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
      >
        Delete
      </button>
    </div>,
    document.body
  );
};
