import type { PaymentStatus } from '../../types/workOrder';

const styles: Record<PaymentStatus, { backgroundColor: string; color: string }> = {
  paid:    { backgroundColor: '#dcfce7', color: '#16a34a' },
  partial: { backgroundColor: '#fef9c3', color: '#a16207' },
  pending: { backgroundColor: '#fee2e2', color: '#dc2626' },
};

const labels: Record<PaymentStatus, string> = {
  paid: 'Paid', partial: 'Partial', pending: 'Pending',
};

interface Props {
  status: PaymentStatus;
  className?: string;
}

export default function Badge({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={styles[status]}
    >
      {labels[status]}
    </span>
  );
}
