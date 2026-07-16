import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
});

export const useCustomerForm = () => {
  const form = useForm({ resolver: zodResolver(customerSchema) });

  const formatPhoneNumber = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length > 0) {
      if (formatted.length <= 3) {
        formatted = `(${formatted}`;
      } else if (formatted.length <= 6) {
        formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`;
      } else {
        formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3, 6)}-${formatted.slice(6, 10)}`;
      }
    }
    return formatted;
  };

  return { form, formatPhoneNumber };
};
