import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const createPaymentSchema = (maxAmount: number) => 
  z.object({
    amount: z.number()
      .refine(val => val > 0, 'Amount must be greater than $0.00')
      .refine(val => val >= 0.01, 'Amount must be at least $0.01')
      .refine(val => val <= maxAmount, `Cannot exceed amount due (${maxAmount.toFixed(2)})`),
    method: z.enum(['zelle', 'card', 'cash']),
    date: z.string(),
  });

export const usePaymentForm = (maxAmount: number) => {
  const form = useForm({
    resolver: zodResolver(createPaymentSchema(maxAmount)),
  });

  return form;
};
