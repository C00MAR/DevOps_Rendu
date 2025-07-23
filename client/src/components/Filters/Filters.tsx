import React, { useState, useRef, useEffect } from 'react';
import { FilterType } from '../../types/todo';

interface FiltersProps {
  filter: FilterType;
  searchTerm: string;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (search: string) => void;
  totalTodos: number;
  activeTodos: number;
  completedTodos: number;
}

const Filters: React.FC<FiltersProps> = ({
  filter,
  searchTerm,
  onFilterChange,
  onSearchChange,
  totalTodos,
  activeTodos,
  completedTodos
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier pour la recherche (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filters = [
    {
      key: 'all' as FilterType,
      label: 'Toutes',
      count: totalTodos,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'text-gray-600',
      activeColor: 'bg-gray-100 text-gray-900 border-gray-300'
    },
    {
      key: 'active' as FilterType,
      label: 'Actives',
      count: activeTodos,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-blue-600',
      activeColor: 'bg-blue-50 text-blue-700 border-blue-300'
    },
    {
      key: 'completed' as FilterType,
      label: 'Terminées',
      count: completedTodos,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      activeColor: 'bg-green-50 text-green-700 border-green-300'
    }
  ];

  const clearSearch = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Barre de recherche */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Rechercher dans les tâches..."
              className={`w-full pl-10 pr-10 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 ${
                isSearchFocused ? 'border-blue-300' : 'border-gray-200'
              } placeholder-gray-400`}
            />

            {/* Bouton clear et raccourci */}
            <div className="absolute inset-y-0 right-0 flex items-center">
              {searchTerm ? (
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Effacer la recherche"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <div className="mr-3 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                  ⌘K
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-2">
          {filters.map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => onFilterChange(filterOption.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 hover:bg-gray-50 ${
                filter === filterOption.key
                  ? filterOption.activeColor
                  : `border-gray-200 ${filterOption.color} hover:border-gray-300`
              }`}
            >
              <span className={filter === filterOption.key ? '' : filterOption.color}>
                {filterOption.icon}
              </span>
              <span>{filterOption.label}</span>
              {filterOption.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === filterOption.key
                    ? 'bg-white/50'
                    : 'bg-gray-100'
                }`}>
                  {filterOption.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchTerm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>
                Recherche pour <span className="font-medium">"{searchTerm}"</span>
              </span>
            </div>
            
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Effacer
            </button>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      {totalTodos > 0 && !searchTerm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">{totalTodos}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{activeTodos}</div>
              <div className="text-xs text-gray-500">Actives</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{completedTodos}</div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
          </div>
          
          {/* Barre de progression globale */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Progression globale</span>
              <span>{totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;