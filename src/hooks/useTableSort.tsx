import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort, 
  className = "",
  children 
}: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th 
      className={`cursor-pointer select-none hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {children || label}
        </div>
        <div className="flex flex-col ml-2">
          <svg 
            className={`w-3 h-3 transition-colors ${
              isActive && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <svg 
            className={`w-3 h-3 -mt-1 transition-colors ${
              isActive && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </th>
  );
}

export function useTableSort<T>(
  data: T[],
  initialSortKey?: string,
  initialDirection: SortDirection = 'asc'
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialSortKey || '',
    direction: initialSortKey ? initialDirection : null,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle different types
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Fallback to string comparison
        comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current.key === key) {
        // Cycling through: asc -> desc -> null
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return { key: '', direction: null };
        } else {
          return { key, direction: 'asc' };
        }
      } else {
        // New column, start with asc
        return { key, direction: 'asc' };
      }
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    SortableHeader: (props: Omit<SortableHeaderProps, 'currentSort' | 'onSort'>) => (
      <SortableHeader {...props} currentSort={sortConfig} onSort={handleSort} />
    ),
  };
}

// Helper function to get nested object values using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Handle array access like "teachers.0.name"
    if (key.match(/^\d+$/)) {
      return current?.[parseInt(key)];
    }
    
    // Handle special cases for arrays
    if (key === 'length' && Array.isArray(current)) {
      return current.length;
    }
    
    // Handle joining arrays for display
    if (key === 'join' && Array.isArray(current)) {
      return current.map(item => {
        if (typeof item === 'object' && item.name) return item.name;
        if (typeof item === 'object' && item.group?.name) return item.group.name;
        if (typeof item === 'object' && item.teacher?.user?.name) return item.teacher.user.name;
        return String(item);
      }).join(', ');
    }
    
    return current?.[key];
  }, obj);
}