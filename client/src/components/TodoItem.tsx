import React, { useState } from 'react';
import { Todo } from '../types/Todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { title?: string; description?: string }) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');

  const handleSave = () => {
    onUpdate(todo.id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg p-4 transition-all duration-200 hover:border-dark-hover ${
      todo.completed ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="mt-1 h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
        />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Titre de la tâche"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                placeholder="Description (optionnelle)"
                rows={2}
              />
            </div>
          ) : (
            <div>
              <h3 className={`font-medium text-dark-text mb-1 ${
                todo.completed ? 'line-through text-dark-text-secondary' : ''
              }`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={`text-sm text-dark-text-secondary mb-2 ${
                  todo.completed ? 'line-through' : ''
                }`}>
                  {todo.description}
                </p>
              )}
              <span className="text-xs text-dark-text-secondary">
                Créé le {formatDate(todo.createdAt)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="p-2 text-green-400 hover:text-green-300 hover:bg-dark-hover rounded-md transition-all duration-200"
                title="Sauvegarder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button 
                onClick={handleCancel} 
                className="p-2 text-red-400 hover:text-red-300 hover:bg-dark-hover rounded-md transition-all duration-200"
                title="Annuler"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2 text-dark-text-secondary hover:text-dark-text hover:bg-dark-hover rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={todo.completed}
                title="Modifier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={() => onDelete(todo.id)} 
                className="p-2 text-red-400 hover:text-red-300 hover:bg-dark-hover rounded-md transition-all duration-200"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
