import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getChatbotsByClientId, createChatbot, getClientById } from '@/lib/data';

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

    const clientId = request.nextUrl.searchParams.get('clientId') || decoded.clientId;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check permissions
    if (decoded.role !== 'hyper' && decoded.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const chatbots = await getChatbotsByClientId(clientId);
    return NextResponse.json({ chatbots });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const clientId = data.clientId || decoded.clientId;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check permissions
    if (decoded.role !== 'hyper' && decoded.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const chatbot = await createChatbot({
      clientId,
      name: data.name,
      siteUrl: data.siteUrl,
      businessName: data.businessName,
      settings: data.settings || {
        welcomeMessage: 'Hello! How can I help you today?',
        responseStyle: 'professional',
        maxTokens: 1000,
        temperature: 0.7,
        enabled: true,
      },
    });

    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

