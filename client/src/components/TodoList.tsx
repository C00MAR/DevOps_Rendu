import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { title?: string; description?: string }) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const activeTodos = totalTodos - completedTodos;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-dark-text">{totalTodos}</div>
          <div className="text-sm text-dark-text-secondary">Total</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-dark-text">{activeTodos}</div>
          <div className="text-sm text-dark-text-secondary">En cours</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-dark-text">{completedTodos}</div>
          <div className="text-sm text-dark-text-secondary">Terminées</div>
        </div>
      </div>

      {/* Todos */}
      <div>
        {todos.length === 0 ? (
          <div className="text-center py-12 text-dark-text-secondary">
            <div className="text-lg">
              Aucune tâche pour le moment
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
