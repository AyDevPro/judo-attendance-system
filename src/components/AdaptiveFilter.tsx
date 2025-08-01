"use client";
import { useState, useEffect } from 'react';

export type FilterPreset = 'mobile' | 'tablet' | 'desktop' | 'custom';

export interface ColumnConfig {
  key: string;
  label: string;
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

interface AdaptiveFilterProps {
  columns: ColumnConfig[];
  onFilterChange: (visibleColumns: string[]) => void;
  storageKey: string;
  className?: string;
}

export function AdaptiveFilter({ 
  columns, 
  onFilterChange, 
  storageKey, 
  className = "" 
}: AdaptiveFilterProps) {
  const [currentPreset, setCurrentPreset] = useState<FilterPreset>('desktop');
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Detect screen size
  const getScreenPreset = (): FilterPreset => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Get visible columns based on preset
  const getVisibleColumns = (preset: FilterPreset, custom?: string[]): string[] => {
    if (preset === 'custom' && custom) {
      return custom;
    }
    
    return columns
      .filter(col => {
        switch (preset) {
          case 'mobile': return col.mobile;
          case 'tablet': return col.tablet;
          case 'desktop': return col.desktop;
          default: return col.desktop;
        }
      })
      .map(col => col.key);
  };

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { preset, customColumns: savedCustom } = JSON.parse(saved);
        if (preset === 'custom' && savedCustom) {
          setCurrentPreset('custom');
          setCustomColumns(savedCustom);
          setIsCustomMode(true);
          onFilterChange(savedCustom);
        } else {
          const screenPreset = getScreenPreset();
          setCurrentPreset(screenPreset);
          onFilterChange(getVisibleColumns(screenPreset));
        }
      } else {
        // Auto-detect on first load
        const screenPreset = getScreenPreset();
        setCurrentPreset(screenPreset);
        onFilterChange(getVisibleColumns(screenPreset));
      }
    } catch (error) {
      console.error('Error loading filter preferences:', error);
      const screenPreset = getScreenPreset();
      setCurrentPreset(screenPreset);
      onFilterChange(getVisibleColumns(screenPreset));
    }
  }, [storageKey, onFilterChange]);

  // Save preferences to localStorage
  const savePreferences = (preset: FilterPreset, custom?: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        preset,
        customColumns: custom
      }));
    } catch (error) {
      console.error('Error saving filter preferences:', error);
    }
  };

  // Handle preset change
  const handlePresetChange = (preset: FilterPreset) => {
    setCurrentPreset(preset);
    
    if (preset === 'custom') {
      setIsCustomMode(true);
      const visible = customColumns.length > 0 ? customColumns : getVisibleColumns('desktop');
      setCustomColumns(visible);
      onFilterChange(visible);
      savePreferences(preset, visible);
    } else {
      setIsCustomMode(false);
      const visible = getVisibleColumns(preset);
      onFilterChange(visible);
      savePreferences(preset);
    }
  };

  // Handle custom column toggle
  const handleColumnToggle = (columnKey: string) => {
    const updated = customColumns.includes(columnKey)
      ? customColumns.filter(key => key !== columnKey)
      : [...customColumns, columnKey];
    
    setCustomColumns(updated);
    onFilterChange(updated);
    savePreferences('custom', updated);
  };

  // Auto-detect current screen size
  const detectScreenSize = () => {
    const detected = getScreenPreset();
    handlePresetChange(detected);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-col space-y-4">
        {/* Preset Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Affichage :</span>
          
          <button
            onClick={() => handlePresetChange('mobile')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              currentPreset === 'mobile'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border`}
          >
            📱 Mobile
          </button>
          
          <button
            onClick={() => handlePresetChange('tablet')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              currentPreset === 'tablet'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border`}
          >
            📊 Tablette
          </button>
          
          <button
            onClick={() => handlePresetChange('desktop')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              currentPreset === 'desktop'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border`}
          >
            💻 Bureau
          </button>
          
          <button
            onClick={() => handlePresetChange('custom')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              currentPreset === 'custom'
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border`}
          >
            ⚙️ Personnalisé
          </button>
          
          <button
            onClick={detectScreenSize}
            className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
            title="Détecter automatiquement la taille d'écran"
          >
            🎯 Auto
          </button>
        </div>

        {/* Custom Column Selection */}
        {isCustomMode && (
          <div className="border-t border-gray-200 pt-4">
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Colonnes à afficher :
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {columns.map(column => (
                <label
                  key={column.key}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={customColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-500">
          {currentPreset === 'mobile' && '📱 Affichage mobile : nom, prénom, ceinture'}
          {currentPreset === 'tablet' && '📊 Affichage tablette : + date de naissance, groupes'}
          {currentPreset === 'desktop' && '💻 Affichage bureau : toutes les colonnes'}
          {currentPreset === 'custom' && `⚙️ Affichage personnalisé : ${customColumns.length} colonnes sélectionnées`}
        </div>
      </div>
    </div>
  );
}