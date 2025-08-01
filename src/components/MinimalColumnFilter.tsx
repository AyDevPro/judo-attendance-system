"use client";
import { useState } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

interface MinimalColumnFilterProps {
  columns: ColumnConfig[];
  onFilterChange: (visibleColumns: string[]) => void;
  storageKey?: string;
}

export function MinimalColumnFilter({ 
  columns, 
  onFilterChange,
  storageKey
}: MinimalColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Utiliser directement les colonnes par défaut
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const defaultCols = columns.filter(col => col.defaultVisible).map(col => col.key);
    // Notifier le parent après l'initialisation
    setTimeout(() => onFilterChange(defaultCols), 0);
    return defaultCols;
  });

  const handleColumnToggle = (columnKey: string) => {
    const updated = visibleColumns.includes(columnKey)
      ? visibleColumns.filter(key => key !== columnKey)
      : [...visibleColumns, columnKey];
    
    setVisibleColumns(updated);
    onFilterChange(updated);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        Personnaliser l'affichage
        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Colonnes à afficher
            </h3>
            
            <div className="space-y-2">
              {columns.map(column => (
                <label
                  key={column.key}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}