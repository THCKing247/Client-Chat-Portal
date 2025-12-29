'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chatbot } from '@/types';
import { X } from 'lucide-react';

interface ChatbotModalProps {
  chatbot: Chatbot | null;
  onClose: () => void;
}

export default function ChatbotModal({ chatbot, onClose }: ChatbotModalProps) {
  const { token, selectedClientId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    siteUrl: '',
    businessName: '',
    settings: {
      welcomeMessage: 'Hello! How can I help you today?',
      responseStyle: 'professional' as 'professional' | 'casual' | 'friendly',
      maxTokens: 1000,
      temperature: 0.7,
      enabled: true,
      customInstructions: '',
    },
  });

  useEffect(() => {
    if (chatbot) {
      setFormData({
        name: chatbot.name,
        siteUrl: chatbot.siteUrl || '',
        businessName: chatbot.businessName || '',
        settings: chatbot.settings,
      });
    }
  }, [chatbot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = chatbot ? `/api/chatbots/${chatbot.id}` : '/api/chatbots';
      const method = chatbot ? 'PATCH' : 'POST';

      const payload = chatbot
        ? formData
        : {
            ...formData,
            clientId: selectedClientId,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save chatbot');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {chatbot ? 'Edit Chatbot' : 'Create Chatbot'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chatbot Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site URL
            </label>
            <input
              type="url"
              value={formData.siteUrl}
              onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Welcome Message
            </label>
            <textarea
              value={formData.settings.welcomeMessage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, welcomeMessage: e.target.value },
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Style
              </label>
              <select
                value={formData.settings.responseStyle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      responseStyle: e.target.value as 'professional' | 'casual' | 'friendly',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.settings.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, maxTokens: parseInt(e.target.value) },
                  })
                }
                min={100}
                max={4000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature: {formData.settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.settings.temperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, temperature: parseFloat(e.target.value) },
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Instructions
            </label>
            <textarea
              value={formData.settings.customInstructions || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, customInstructions: e.target.value },
                })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Additional instructions for the chatbot..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.settings.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, enabled: e.target.checked },
                })
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
              Enable this chatbot
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : chatbot ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

