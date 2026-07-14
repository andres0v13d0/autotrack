import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Circle, Clock, CheckCircle2, AlertCircle, Check } from 'lucide-react';

interface WorkOrderFiltersProps {
  deliveryStatus: 'all' | 'new' | 'in_progress' | 'ready' | 'delivered';
  paymentStatus: 'all' | 'pending' | 'partial' | 'paid';
  onDeliveryStatusChange: (status: any) => void;
  onPaymentStatusChange: (status: any) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const DELIVERY_STATUSES = [
  { value: 'all', label: 'All Orders', icon: null },
  { value: 'new', label: 'New', icon: Circle, color: 'text-slate-400', bgColor: 'bg-white border-2 border-slate-900' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { value: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { value: 'delivered', label: 'Delivered', icon: Check, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
];

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Payments', icon: null },
  { value: 'pending', label: 'Pending', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'partial', label: 'Partial', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { value: 'paid', label: 'Paid', icon: Check, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
];

export default function WorkOrderFilters({
  deliveryStatus,
  paymentStatus,
  onDeliveryStatusChange,
  onPaymentStatusChange,
  searchQuery = '',
  onSearchChange,
}: WorkOrderFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = deliveryStatus !== 'all' || paymentStatus !== 'all' || searchQuery;

  const currentDeliveryLabel = DELIVERY_STATUSES.find(s => s.value === deliveryStatus)?.label || 'All Orders';
  const currentPaymentLabel = PAYMENT_STATUSES.find(s => s.value === paymentStatus)?.label || 'All Payments';

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deliveryRef.current && !deliveryRef.current.contains(event.target as Node)) {
        setDeliveryOpen(false);
      }
      if (paymentRef.current && !paymentRef.current.contains(event.target as Node)) {
        setPaymentOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-8 space-y-5">
      {/* Premium Search Bar */}
      <div className="relative group">
        <div className={`relative flex items-center px-4 h-11 rounded-xl border-2 transition-all duration-200 bg-white ${
          isFocused 
            ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'border-slate-200 hover:border-slate-300'
        }`}>
          <Search size={18} className={`transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : 'text-slate-400'
          }`} />
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search orders, plates, customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 ml-3 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} className="text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-3 flex-wrap lg:flex-nowrap">
        {/* Delivery Status Dropdown */}
        <div ref={deliveryRef} className="relative flex-1">
          <button
            onClick={() => {
              setDeliveryOpen(!deliveryOpen);
              setPaymentOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 h-11 rounded-xl border-2 transition-all duration-200 ${
              deliveryOpen
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{currentDeliveryLabel}</span>
            </span>
            <ChevronDown 
              size={18} 
              className={`text-slate-400 transition-transform duration-200 ${deliveryOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {deliveryOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {DELIVERY_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    onDeliveryStatusChange(status.value);
                    setDeliveryOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    deliveryStatus === status.value
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  } border-b border-slate-100 last:border-b-0`}
                >
                  {status.icon ? (
                    <>
                      {status.value === 'new' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-white" />
                      ) : (
                        <status.icon size={18} className={status.color} />
                      )}
                      <span>{status.label}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">{status.label}</span>
                  )}
                  {deliveryStatus === status.value && (
                    <Check size={16} className="ml-auto text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status Dropdown */}
        <div ref={paymentRef} className="relative flex-1">
          <button
            onClick={() => {
              setPaymentOpen(!paymentOpen);
              setDeliveryOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 h-11 rounded-xl border-2 transition-all duration-200 ${
              paymentOpen
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{currentPaymentLabel}</span>
            </span>
            <ChevronDown 
              size={18} 
              className={`text-slate-400 transition-transform duration-200 ${paymentOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {paymentOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {PAYMENT_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    onPaymentStatusChange(status.value);
                    setPaymentOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    paymentStatus === status.value
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  } border-b border-slate-100 last:border-b-0`}
                >
                  {status.icon ? (
                    <>
                      <status.icon size={18} className={status.color} />
                      <span>{status.label}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">{status.label}</span>
                  )}
                  {paymentStatus === status.value && (
                    <Check size={16} className="ml-auto text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onDeliveryStatusChange('all');
              onPaymentStatusChange('all');
              onSearchChange?.('');
            }}
            className="px-4 h-11 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200/50">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-blue-700">
            {[searchQuery ? 1 : 0, deliveryStatus !== 'all' ? 1 : 0, paymentStatus !== 'all' ? 1 : 0].filter(Boolean).length} active filter{[searchQuery ? 1 : 0, deliveryStatus !== 'all' ? 1 : 0, paymentStatus !== 'all' ? 1 : 0].filter(Boolean).length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}
