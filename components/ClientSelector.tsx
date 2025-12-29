'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';

export default function ClientSelector() {
  const { token, isHyperUser, selectedClientId, setSelectedClientId } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHyperUser || !token) return;

    fetch('/api/clients', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) {
          setClients(data.clients);
          if (!selectedClientId && data.clients.length > 0) {
            setSelectedClientId(data.clients[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, isHyperUser, selectedClientId, setSelectedClientId]);

  if (!isHyperUser) return null;

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Switch Client Portal
      </label>
      <select
        value={selectedClientId || ''}
        onChange={(e) => setSelectedClientId(e.target.value || null)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        disabled={loading}
      >
        <option value="">Select a client...</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}

