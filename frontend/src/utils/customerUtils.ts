import type { Customer } from '../types';

export const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export const filterCustomers = (customers: Customer[], searchQuery: string) => {
  return customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const plates = c.vehicles?.map(v => v.plate.toLowerCase()).join('|') || '';
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      plates.includes(q)
    );
  });
};

export const formatWorkOrderDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
