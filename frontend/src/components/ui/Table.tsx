import React from 'react';
import { TableSkeleton } from './Skeletons';

export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableAction<T> {
  label: string;
  icon?: string | React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: (row: T) => boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey: string;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  actions,
  isLoading,
  emptyMessage = 'No data',
  onRowClick,
  rowKey,
}: TableProps<T>) {
  const getAlignment = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getActionVariantStyle = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'text-red-500 hover:text-red-700 hover:bg-red-50';
      case 'primary':
        return 'text-blue-500 hover:text-blue-700 hover:bg-blue-50';
      default:
        return 'text-gray-500 hover:text-gray-700 hover:bg-gray-50';
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#0f1f3d' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 font-medium text-white/80 ${getAlignment(col.align)}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-5 py-3.5 font-medium text-white/80 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row[rowKey]}
                className={`border-t border-gray-100 hover:bg-orange-50/40 transition-colors cursor-pointer ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={`${row[rowKey]}-${col.key}`} className={`px-5 py-3.5 text-gray-700 ${getAlignment(col.align)}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          disabled={action.disabled?.(row)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${getActionVariantStyle(
                            action.variant,
                          )} disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={action.label}
                        >
                          {action.icon && (
                            typeof action.icon === 'string' ? (
                              <span>{action.icon}</span>
                            ) : (
                              <span className="flex">{action.icon}</span>
                            )
                          )}
                          <span className="text-xs font-semibold">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
