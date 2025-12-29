'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatReport, Chatbot } from '@/types';
import { BarChart3, TrendingUp, MessageSquare, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const { token, selectedClientId, selectedChatbotId } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<string>('');
  const [report, setReport] = useState<ChatReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

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
          if (data.chatbots.length > 0) {
            const chatbotId = selectedChatbotId || data.chatbots[0].id;
            setSelectedChatbot(chatbotId);
            loadReport(chatbotId);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedClientId, selectedChatbotId]);

  const loadReport = (chatbotId: string) => {
    if (!chatbotId || !token) return;

    const startDate = new Date(dateRange.start).toISOString();
    const endDate = new Date(dateRange.end + 'T23:59:59').toISOString();

    fetch(
      `/api/reports?chatbotId=${chatbotId}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.report) {
          setReport(data.report);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (selectedChatbot) {
      loadReport(selectedChatbot);
    }
  }, [dateRange, selectedChatbot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots found</h3>
        <p className="text-gray-600">Create a chatbot to view reports</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View detailed analytics for your chatbots</p>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chatbot
            </label>
            <select
              value={selectedChatbot}
              onChange={(e) => setSelectedChatbot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {chatbots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {report.totalSessions}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MessageSquare className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {report.totalMessages}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {report.averageSessionDuration.toFixed(1)}m
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sessions Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report.sessionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Messages Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

