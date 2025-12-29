import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getChatReport, getChatbotById } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const chatbotId = request.nextUrl.searchParams.get('chatbotId');
    const startDate = request.nextUrl.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = request.nextUrl.searchParams.get('endDate') || new Date().toISOString();

    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID is required' }, { status: 400 });
    }

    const chatbot = await getChatbotById(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Check permissions
    if (decoded.role !== 'hyper' && decoded.clientId !== chatbot.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const report = await getChatReport(chatbotId, startDate, endDate);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

