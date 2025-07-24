import React, { useState } from 'react';
import { CreateTodoRequest } from '../types/Todo';

interface AddTodoFormProps {
  onAdd: (todo: CreateTodoRequest) => Promise<any>;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ajouter une nouvelle tâche..."
            className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
            onFocus={() => setIsExpanded(true)}
            disabled={isSubmitting}
          />
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnelle)"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setDescription('');
                }}
                className="px-4 py-2 text-dark-text-secondary hover:text-dark-text border border-dark-border hover:border-dark-hover rounded-md transition-all duration-200"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!title.trim() || isSubmitting}
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
