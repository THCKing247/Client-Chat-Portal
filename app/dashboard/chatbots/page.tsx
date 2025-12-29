'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chatbot } from '@/types';
import { Plus, Edit, Trash2, Bot, Settings as SettingsIcon } from 'lucide-react';
import ChatbotModal from '@/components/ChatbotModal';

export default function ChatbotsPage() {
  const { token, selectedClientId } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedClientId || !token) return;

    fetch(`/api/chatbots?clientId=${selectedClientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.chatbots) {
          setChatbots(data.chatbots);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedClientId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chatbot?')) return;

    const response = await fetch(`/api/chatbots/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setChatbots(chatbots.filter((b) => b.id !== id));
    }
  };

  const handleEdit = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedChatbot(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedChatbot(null);
    // Refresh chatbots
    if (selectedClientId && token) {
      fetch(`/api/chatbots?clientId=${selectedClientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.chatbots) {
            setChatbots(data.chatbots);
          }
        });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chatbots...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-600 mt-1">Manage your AI chatbot configurations</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          New Chatbot
        </button>
      </div>

      {chatbots.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bot size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first chatbot</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} className="mr-2" />
            Create Chatbot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <div
              key={chatbot.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded-lg mr-3">
                    <Bot size={24} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{chatbot.name}</h3>
                    {chatbot.businessName && (
                      <p className="text-sm text-gray-500">{chatbot.businessName}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(chatbot)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(chatbot.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {chatbot.siteUrl && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Site:</span> {chatbot.siteUrl}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    chatbot.settings.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {chatbot.settings.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-xs text-gray-500">
                  {chatbot.settings.responseStyle}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ChatbotModal
          chatbot={selectedChatbot}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

