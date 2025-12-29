'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSession } from '@/types';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function SessionsPage() {
  const { token, selectedClientId, selectedChatbotId } = useAuth();
  const [sessions, setSessions] = useState<MessageSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<MessageSession | null>(null);

  useEffect(() => {
    if (!selectedClientId || !token) return;

    const url = selectedChatbotId
      ? `/api/sessions?chatbotId=${selectedChatbotId}`
      : `/api/sessions?clientId=${selectedClientId}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedClientId, selectedChatbotId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Message Sessions</h1>
        <p className="text-gray-600 mt-1">View and manage chat conversations</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600">Chat sessions will appear here once users start conversations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Sessions ({sessions.length})</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(session.startedAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {session.messages[0]?.content || 'No messages'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.messages.length} messages
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Started: {format(new Date(selectedSession.startedAt), 'PPpp')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        selectedSession.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedSession.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {format(new Date(message.timestamp), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select a session to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

