"use client";
import { useState, useEffect, useCallback } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

interface SimpleColumnFilterProps {
  columns: ColumnConfig[];
  onFilterChange: (visibleColumns: string[]) => void;
  storageKey: string;
}

export function SimpleColumnFilter({ 
  columns, 
  onFilterChange, 
  storageKey 
}: SimpleColumnFilterProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Initialiser avec les colonnes par défaut
  useEffect(() => {
    // Éviter de relancer si déjà initialisé
    if (visibleColumns.length > 0) return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedColumns = JSON.parse(saved);
        setVisibleColumns(savedColumns);
        onFilterChange(savedColumns);
      } else {
        // Utiliser les colonnes par défaut
        const defaultColumns = columns
          .filter(col => col.defaultVisible)
          .map(col => col.key);
        setVisibleColumns(defaultColumns);
        onFilterChange(defaultColumns);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      const defaultColumns = columns
        .filter(col => col.defaultVisible)
        .map(col => col.key);
      setVisibleColumns(defaultColumns);
      onFilterChange(defaultColumns);
    }
  }, [storageKey, columns]); // Garder les dépendances mais ajouter une garde

  // Sauvegarder les préférences
  const savePreferences = (newColumns: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Gérer le toggle d'une colonne avec useCallback pour éviter les re-renders
  const handleColumnToggle = useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
      const updated = prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey];
      
      onFilterChange(updated);
      savePreferences(updated);
      return updated;
    });
  }, [onFilterChange]);

  return (
    <div className="relative">
      {/* Bouton pour ouvrir/fermer */}
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

      {/* Panel des options */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Colonnes à afficher
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {columns.map(column => (
                <label
                  key={column.key}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">{column.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              {visibleColumns.length} colonne{visibleColumns.length > 1 ? 's' : ''} sélectionnée{visibleColumns.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer en cliquant à l'extérieur */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}