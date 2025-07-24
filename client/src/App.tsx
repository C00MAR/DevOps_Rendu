import React from 'react';
import './App.css';
import { useTodos } from './hooks/useTodos';
import { AddTodoForm } from './components/AddTodoForm';
import { TodoList } from './components/TodoList';

function App() {
  const {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch,
  } = useTodos();

  const handleUpdateTodo = async (id: string, updates: { title?: string; description?: string }) => {
    try {
      await updateTodo(id, updates);
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-text mb-4 mx-auto"></div>
          <p className="text-dark-text">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green text-dark-text">
      <header className="lime-bg border-b border-dark-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="font-black text-black custom-font">
            CHECKY
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-red-300">{error}</span>
              <button 
                onClick={refetch} 
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-red-100 rounded-md transition-colors duration-200 text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <AddTodoForm onAdd={createTodo} />
          </div>

          <div>
            <TodoList
              todos={todos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={handleUpdateTodo}
            />
          </div>
        </div>
      </main>

      <footer className="mt-16 py-6 border-t border-dark-border">
        <p className="text-center text-dark-text-secondary text-sm">
          IIM DevOps Project
        </p>
      </footer>
    </div>
  );
}

export default App;
