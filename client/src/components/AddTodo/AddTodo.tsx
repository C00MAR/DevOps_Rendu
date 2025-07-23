import React, { useState } from 'react';
import { CreateTodoRequest, AddTodoProps } from '../../types/todo';

const AddTodo: React.FC<AddTodoProps> = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState<CreateTodoRequest>({
    title: '',
    description: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Le titre ne peut pas dépasser 100 caractères';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onAdd({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined
      });
      
      // Reset form après succès
      setFormData({ title: '', description: '' });
      setIsExpanded(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
    if (errors.title) {
      setErrors({ ...errors, title: undefined });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
    if (errors.description) {
      setErrors({ ...errors, description: undefined });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <div className="relative">
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ajouter une nouvelle tâche..."
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
              } placeholder-gray-400`}
              disabled={loading}
            />
            
            {/* Bouton d'ajout rapide */}
            {formData.title.trim() && !isExpanded && (
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            )}
          </div>
          
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.title}
            </p>
          )}
        </div>

        {/* Description (visible quand étendu) */}
        {isExpanded && (
          <div className="animate-in fade-in duration-200">
            <textarea
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Description (optionnelle)..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
              } placeholder-gray-400`}
              disabled={loading}
            />
            
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.description}
              </p>
            )}

            {/* Compteur de caractères */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>Description: {formData.description?.length || 0}/500</span>
              <span>Titre: {formData.title.length}/100</span>
            </div>
          </div>
        )}

        {/* Boutons d'action (visible quand étendu) */}
        {isExpanded && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setFormData({ title: '', description: '' });
                setErrors({});
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200"
              disabled={loading}
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ajout...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Ajouter</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddTodo;