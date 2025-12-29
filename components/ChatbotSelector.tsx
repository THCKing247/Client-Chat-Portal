'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chatbot } from '@/types';

export default function ChatbotSelector() {
  const { token, selectedClientId, selectedChatbotId, setSelectedChatbotId } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClientId || !token) {
      setChatbots([]);
      setLoading(false);
      return;
    }

    fetch(`/api/chatbots?clientId=${selectedClientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.chatbots) {
          setChatbots(data.chatbots);
          if (!selectedChatbotId && data.chatbots.length > 0) {
            setSelectedChatbotId(data.chatbots[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedClientId, selectedChatbotId, setSelectedChatbotId]);

  if (!selectedClientId) return null;

  if (chatbots.length <= 1) return null; // Only show if multiple chatbots

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Switch Chatbot
      </label>
      <select
        value={selectedChatbotId || ''}
        onChange={(e) => setSelectedChatbotId(e.target.value || null)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        disabled={loading}
      >
        <option value="">All Chatbots</option>
        {chatbots.map((chatbot) => (
          <option key={chatbot.id} value={chatbot.id}>
            {chatbot.name}
          </option>
        ))}
      </select>
    </div>
  );
}

