import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsersByClientId, createUser, hashPassword } from '@/lib/data';

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

    // Check permissions - only client_admin and hyper can view users
    if (decoded.role === 'user') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (decoded.role !== 'hyper' && decoded.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getUsersByClientId(clientId);
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json({ users: usersWithoutPasswords });
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

    const { email, password, name, role } = await request.json();
    const clientId = decoded.clientId;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Only client_admin and hyper can create users
    if (decoded.role === 'user') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Non-hyper users can only create users for their own client
    if (decoded.role !== 'hyper' && !clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const userRole = role || 'user';
    if (!['client_admin', 'user'].includes(userRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({
      email,
      password: hashedPassword,
      name,
      role: userRole as 'client_admin' | 'user',
      clientId: clientId || decoded.clientId,
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

