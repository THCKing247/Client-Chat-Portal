import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSessionsByClientId, getSessionsByChatbotId } from '@/lib/data';

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
    const clientId = request.nextUrl.searchParams.get('clientId') || decoded.clientId;

    if (!clientId && decoded.role !== 'hyper') {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check permissions
    if (decoded.role !== 'hyper' && decoded.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessions = chatbotId
      ? await getSessionsByChatbotId(chatbotId)
      : await getSessionsByClientId(clientId!);

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

