# Client Portal - AI Chatbot Management

A comprehensive client portal for managing AI chatbot settings, message sessions, and analytics reports.

## Features

- **Authentication & Authorization**: Secure login with role-based access
- **Multi-Tenant Support**: Clients can manage their own portals
- **Hyper Users**: Users who can switch between multiple client portals
- **Chatbot Management**: Configure and manage multiple chatbots per client
- **Message Sessions**: View and manage chat conversations
- **Analytics & Reports**: Comprehensive chat analytics and reporting
- **User Management**: Add and manage team members

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Login Credentials

- **Hyper User**: `hyper@example.com` / `password123`
- **Client Admin**: `client@example.com` / `password123`
- **Regular User**: `user@example.com` / `password123`

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- JWT Authentication
- JSON-based data storage (can be migrated to database)

