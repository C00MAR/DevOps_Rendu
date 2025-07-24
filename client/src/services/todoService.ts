import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/Todo';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class TodoService {
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Vérifier s'il y a du contenu à parser
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // Si c'est une réponse 204 (No Content) ou si le content-length est 0, ne pas essayer de parser le JSON
      if (response.status === 204 || contentLength === '0') {
        return null;
      }
      
      // Si le content-type n'est pas JSON, ne pas essayer de parser
      if (contentType && !contentType.includes('application/json')) {
        return null;
      }

      // Essayer de parser le JSON seulement s'il y a du contenu
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/todos`);
  }

  async getTodoById(id: string): Promise<Todo> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/todos/${id}`);
  }

  async createTodo(todo: CreateTodoRequest): Promise<Todo> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/todos`, {
      method: 'POST',
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(id: string, updates: UpdateTodoRequest): Promise<Todo> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.fetchWithErrorHandling(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTodo(id: string, completed: boolean): Promise<Todo> {
    return this.updateTodo(id, { completed });
  }
}

export const todoService = new TodoService();
