import React, { useState } from 'react';
import { Todo, FilterType, CreateTodoRequest } from './types/todo';
import { useTodos } from './hooks/useTodos';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import EditModal from './components/EditModal';

const App: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch
  } = useTodos();

  // Filtrer les todos selon le filtre actuel et la recherche
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = searchTerm === '' || 
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !todo.completed) ||
      (filter === 'completed' && todo.completed);

    return matchesSearch && matchesFilter;
  });

  // Statistiques
  const stats = {
    total: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length
  };

  const handleAddTodo = async (todoData: CreateTodoRequest) => {
    try {
      await addTodo(todoData);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedTodo: Todo) => {
    try {
      await updateTodo(updatedTodo.id, {
        title: updatedTodo.title,
        description: updatedTodo.description
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec Tailwind */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Todo App</h1>
                <p className="text-sm text-gray-500">Projet DevOps IIM A4</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Bouton theme */}
              <button 
                onClick={toggleTheme} 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                aria-label="Toggle theme"
              >
                <span className="text-xl">
                  {theme === 'light' ? '🌙' : '☀️'}
                </span>
              </button>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-gray-900">{stats.total}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{stats.active}</div>
                  <div className="text-gray-500">Actifs</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{stats.completed}</div>
                  <div className="text-gray-500">Terminés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Todo Section */}
        <section className="mb-6">
          <AddTodo onAdd={handleAddTodo} loading={loading} />
        </section>

        {/* Search and Filter Section avec Tailwind */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher dans les tâches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              {(['all', 'active', 'completed'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === filterType
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter(filterType)}
                >
                  {filterType === 'all' && 'Tous'}
                  {filterType === 'active' && 'Actifs'}
                  {filterType === 'completed' && 'Terminés'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-red-900">Erreur de connexion</h3>
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={refetch} 
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Todo List Section */}
        <section>
          <TodoList
            todos={filteredTodos}
            loading={loading}
            error={error}
            filter={filter}
            searchTerm={searchTerm}
            onToggle={toggleTodo}
            onEdit={handleEditTodo}
            onDelete={deleteTodo}
          />

          {/* Empty State avec Tailwind */}
          {!loading && !error && filteredTodos.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">
                {searchTerm ? '🔍' : filter === 'completed' ? '🎉' : '📝'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? 'Aucun résultat' 
                  : filter === 'completed' 
                    ? 'Aucune tâche terminée'
                    : filter === 'active'
                      ? 'Aucune tâche active'  
                      : 'Aucune tâche'
                }
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {searchTerm 
                  ? `Aucune tâche ne correspond à "${searchTerm}"`
                  : filter === 'all'
                    ? 'Ajoutez votre première tâche pour commencer'
                    : `Aucune tâche ${filter === 'active' ? 'active' : 'terminée'} pour le moment`
                }
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 Todo App - Projet DevOps IIM A4</p>
          <p className="mt-1">Fait avec ❤️ par Ambre, Marvin, Marc & Thomas</p>
        </div>
      </footer>

      {/* Modal d'édition */}
      <EditModal
        todo={editingTodo}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default App;