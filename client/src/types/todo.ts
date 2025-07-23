// Types pour les Todo items
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Types pour la création d'un todo (sans id et dates)
export interface CreateTodoRequest {
  title: string;
  description?: string;
}

// Types pour la mise à jour d'un todo
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface TodosResponse {
  todos: Todo[];
  total: number;
}

// Types pour les erreurs
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Types pour les filtres
export type FilterType = 'all' | 'active' | 'completed';

// Types pour les actions
export interface TodoActions {
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Types pour les props des composants
export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
}

export interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  filter: FilterType;
  searchTerm: string;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
}

export interface AddTodoProps {
  onAdd: (todo: CreateTodoRequest) => Promise<void>;
  loading: boolean;
}

// Types pour les hooks
export interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (todo: CreateTodoRequest) => Promise<void>;
  updateTodo: (id: string, updates: UpdateTodoRequest) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Types pour les événements de formulaire
export interface FormData {
  title: string;
  description: string;
}

export interface EditModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: Todo) => Promise<void>;
}

// Types pour les notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// Types pour le contexte
export interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// Types utilitaires
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;
