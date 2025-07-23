import React from 'react';
import { TodoListProps } from '../../types/todo';
import TodoItem from '../TodoItem/TodoItem';

const TodoList: React.FC<TodoListProps> = ({
  todos,
  loading,
  error,
  filter,
  searchTerm,
  onToggle,
  onEdit,
  onDelete
}) => {
  // Filtrer les todos
  const filteredTodos = todos.filter(todo => {
    // Filtrer par recherche
    const matchesSearch = searchTerm === '' || 
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrer par statut
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !todo.completed) ||
      (filter === 'completed' && todo.completed);

    return matchesSearch && matchesFilter;
  });

  // Trier les todos (non-complétés en premier, puis par date de création décroissante)
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // D'abord par statut (non-complétés en premier)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Puis par date de création (plus récents en premier)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // États de chargement
  if (loading && todos.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded border-2 flex-shrink-0 mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Liste vide
  if (sortedTodos.length === 0) {
    const getEmptyStateContent = () => {
      if (searchTerm) {
        return {
          icon: (
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ),
          title: "Aucun résultat",
          message: `Aucune tâche ne correspond à "${searchTerm}"`
        };
      }

      if (filter === 'active') {
        return {
          icon: (
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: "Toutes les tâches sont terminées !",
          message: "Félicitations ! Vous avez terminé toutes vos tâches."
        };
      }

      if (filter === 'completed') {
        return {
          icon: (
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          title: "Aucune tâche terminée",
          message: "Les tâches que vous terminez apparaîtront ici."
        };
      }

      return {
        icon: (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
        title: "Aucune tâche",
        message: "Commencez par ajouter votre première tâche !"
      };
    };

    const emptyState = getEmptyStateContent();

    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyState.title}
        </h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          {emptyState.message}
        </p>
      </div>
    );
  }

  // Statistiques rapides
  const stats = {
    total: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length
  };

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      {todos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredTodos.length} {filteredTodos.length === 1 ? 'tâche' : 'tâches'}
              {searchTerm && ` trouvée${filteredTodos.length > 1 ? 's' : ''}`}
              {filter !== 'all' && (
                <span className="ml-1">
                  ({filter === 'active' ? 'actives' : 'terminées'})
                </span>
              )}
            </span>
            
            {filter === 'all' && (
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {stats.active} active{stats.active > 1 ? 's' : ''}
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {stats.completed} terminée{stats.completed > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {/* Barre de progression */}
          {todos.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{Math.round((stats.completed / stats.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des tâches */}
      <div className="space-y-3">
        {sortedTodos.map((todo, index) => (
          <div
            key={todo.id}
            className="animate-in fade-in duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TodoItem
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {/* Indicateur de chargement lors du rafraîchissement */}
      {loading && todos.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Actualisation...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;