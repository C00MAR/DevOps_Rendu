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

      return await response.json();
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
