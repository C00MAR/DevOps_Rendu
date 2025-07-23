import { Todo, CreateTodoRequest, UpdateTodoRequest, ApiError } from '../types/todo';
import { apiClient } from './api';

class TodoService {
  private readonly endpoint = '/todos';

  /**
   * Récupérer tous les todos
   */
  async getAll(): Promise<Todo[]> {
    try {
      const response = await apiClient.get<{ todos: Todo[] } | Todo[]>(this.endpoint);
      
      // Si la réponse a la structure { todos: Todo[] }
      if ('todos' in response.data) {
        return response.data.todos;
      }
      
      // Si la réponse est directement un tableau Todo[]
      return response.data as Todo[];
    } catch (error) {
      throw this.handleError(error, 'Impossible de récupérer les tâches');
    }
  }

  /**
   * Récupérer un todo par ID
   */
  async getById(id: string): Promise<Todo> {
    try {
      const response = await apiClient.get<{ todo: Todo } | Todo>(`${this.endpoint}/${id}`);
      
      // Si la réponse a la structure { todo: Todo }
      if (typeof response.data === 'object' && 'todo' in response.data) {
        return response.data.todo;
      }
      
      // Si la réponse est directement un Todo
      return response.data as Todo;
    } catch (error) {
      throw this.handleError(error, 'Tâche introuvable');
    }
  }

  /**
   * Créer un nouveau todo
   */
  async create(todoData: CreateTodoRequest): Promise<Todo> {
    try {
      // Validation côté client
      this.validateTodoData(todoData);

      const response = await apiClient.post<{ todo: Todo } | Todo>(this.endpoint, {
        ...todoData,
        completed: false,
        createdAt: new Date().toISOString()
      });

      // Si la réponse a la structure { todo: Todo }
      if (typeof response.data === 'object' && 'todo' in response.data) {
        return response.data.todo;
      }
      
      // Si la réponse est directement un Todo
      return response.data as Todo;
    } catch (error) {
      throw this.handleError(error, 'Impossible de créer la tâche');
    }
  }

  /**
   * Mettre à jour un todo
   */
  async update(id: string, updates: UpdateTodoRequest): Promise<Todo> {
    try {
      // Validation des mises à jour
      if (updates.title !== undefined) {
        this.validateTitle(updates.title);
      }
      if (updates.description !== undefined) {
        this.validateDescription(updates.description);
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const response = await apiClient.put<{ todo: Todo } | Todo>(`${this.endpoint}/${id}`, updateData);
      
      // Si la réponse a la structure { todo: Todo }
      if (typeof response.data === 'object' && 'todo' in response.data) {
        return response.data.todo;
      }
      
      // Si la réponse est directement un Todo
      return response.data as Todo;
    } catch (error) {
      throw this.handleError(error, 'Impossible de mettre à jour la tâche');
    }
  }

  /**
   * Supprimer un todo
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      throw this.handleError(error, 'Impossible de supprimer la tâche');
    }
  }

  /**
   * Toggle le statut completed d'un todo
   */
  async toggle(id: string): Promise<Todo> {
    try {
      // D'abord récupérer le todo actuel
      const currentTodo = await this.getById(id);
      
      // Puis mettre à jour son statut
      return await this.update(id, { 
        completed: !currentTodo.completed 
      });
    } catch (error) {
      throw this.handleError(error, 'Impossible de changer le statut de la tâche');
    }
  }

  /**
   * Rechercher des todos
   */
  async search(query: string): Promise<Todo[]> {
    try {
      const response = await apiClient.get<{ todos: Todo[] } | Todo[]>(`${this.endpoint}/search`, {
        params: { q: query }
      });
      
      // Si la réponse a la structure { todos: Todo[] }
      if (typeof response.data === 'object' && 'todos' in response.data) {
        return response.data.todos;
      }
      
      // Si la réponse est directement un tableau Todo[]
      return response.data as Todo[];
    } catch (error) {
      // Si la recherche n'est pas implémentée côté serveur,
      // on fait la recherche côté client
      const allTodos = await this.getAll();
      return allTodos.filter(todo => 
        todo.title.toLowerCase().includes(query.toLowerCase()) ||
        todo.description?.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  /**
   * Récupérer les statistiques des todos
   */
  async getStats(): Promise<{ total: number; active: number; completed: number }> {
    try {
      const todos = await this.getAll();
      return {
        total: todos.length,
        active: todos.filter(todo => !todo.completed).length,
        completed: todos.filter(todo => todo.completed).length
      };
    } catch (error) {
      throw this.handleError(error, 'Impossible de récupérer les statistiques');
    }
  }

  /**
   * Validation des données d'un todo
   */
  private validateTodoData(data: CreateTodoRequest): void {
    this.validateTitle(data.title);
    if (data.description) {
      this.validateDescription(data.description);
    }
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Le titre est obligatoire');
    }
    if (title.length > 100) {
      throw new Error('Le titre ne peut pas dépasser 100 caractères');
    }
  }

  private validateDescription(description: string): void {
    if (description && description.length > 500) {
      throw new Error('La description ne peut pas dépasser 500 caractères');
    }
  }

  /**
   * Gestion des erreurs centralisée
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    console.error('TodoService Error:', error);

    // Erreur réseau
    if (!error.response) {
      return {
        message: 'Erreur de connexion au serveur',
        status: 0
      };
    }

    // Erreur HTTP
    const status = error.response?.status;
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   defaultMessage;

    return {
      message,
      status,
      code: error.response?.data?.code
    };
  }
}

// Export d'une instance unique du service
export const todoService = new TodoService();
export default todoService;