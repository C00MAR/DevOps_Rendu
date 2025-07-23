import { useState, useEffect, useCallback } from 'react';
import { Todo, CreateTodoRequest, UpdateTodoRequest, UseTodosReturn } from '../types/todo';
import { todoService } from '../services/todoService';

export const useTodos = (): UseTodosReturn => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les todos
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTodos = await todoService.getAll();
      setTodos(fetchedTodos);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des tâches');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajouter un nouveau todo
  const addTodo = useCallback(async (todoData: CreateTodoRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const newTodo = await todoService.create(todoData);
      setTodos(prevTodos => [newTodo, ...prevTodos]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la tâche');
      console.error('Error adding todo:', err);
      throw err; // Re-throw pour que le composant puisse gérer l'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un todo
  const updateTodo = useCallback(async (id: string, updates: UpdateTodoRequest): Promise<void> => {
    try {
      setError(null);
      const updatedTodo = await todoService.update(id, updates);
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la tâche');
      console.error('Error updating todo:', err);
      throw err;
    }
  }, []);

  // Supprimer un todo
  const deleteTodo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await todoService.delete(id);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la tâche');
      console.error('Error deleting todo:', err);
      throw err;
    }
  }, []);

  // Toggle le statut completed d'un todo
  const toggleTodo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const todo = todos.find(t => t.id === id);
      if (!todo) throw new Error('Tâche introuvable');

      const updatedTodo = await todoService.update(id, { 
        completed: !todo.completed 
      });
      
      setTodos(prevTodos => 
        prevTodos.map(t => 
          t.id === id ? updatedTodo : t
        )
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut');
      console.error('Error toggling todo:', err);
      throw err;
    }
  }, [todos]);

  // Refetch des todos (pour forcer un rechargement)
  const refetch = useCallback(async (): Promise<void> => {
    await fetchTodos();
  }, [fetchTodos]);

  // Charger les todos au montage du composant
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Auto-refresh toutes les 30 secondes (optionnel)
  useEffect(() => {
    const interval = setInterval(() => {
      // Seulement si pas d'erreur et pas en cours de chargement
      if (!error && !loading) {
        fetchTodos();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [error, loading, fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch
  };
};

// Hook pour les statistiques des todos
export const useTodoStats = (todos: Todo[]) => {
  return {
    total: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length,
    completionRate: todos.length > 0 
      ? Math.round((todos.filter(todo => todo.completed).length / todos.length) * 100)
      : 0
  };
};

// Hook pour le filtrage et la recherche
export const useFilteredTodos = (todos: Todo[], filter: string, searchTerm: string) => {
  return todos.filter(todo => {
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
};

// Hook pour localStorage (optionnel - pour la persistence locale)
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};