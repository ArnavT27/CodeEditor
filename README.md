# Collaborative Code Editor

Real-time collaborative code editor with video conferencing and multi-language code execution.

## Features

- Real-time collaborative editing with live cursors
- Integrated Google Meet for video calls
- Execute code in 9+ languages (Python, JavaScript, Java, Go, Rust, PHP, Ruby, Swift, Kotlin)
- User authentication and guest mode
- Monaco Editor (VS Code's editor)

## Prerequisites

- Node.js 18+
- Docker Desktop
- MongoDB (Atlas or local)
- Google Cloud account (for Meet integration)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# MongoDB
DATABASE=mongodb+srv://username:<db_password>@cluster.mongodb.net/
DATABASE_PASSWORD=your_password

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:1234

# Piston API
PISTON_API_URL=http://localhost:2000/api/v2
```

### 3. Start Piston (Code Execution Engine)

```bash
# Start Docker Desktop first, then:
npm run piston:start

# Install language runtimes
npm run piston:install-languages
```

### 4. Start Servers

```bash
# Terminal 1: WebSocket server
npm run ws

# Terminal 2: Next.js dev server
npm run dev
```

Or start both:
```bash
npm run dev:all
```

Visit `http://localhost:3000`

## Piston Management

```bash
npm run piston:start          # Start Piston container
npm run piston:stop           # Stop Piston container
npm run piston:status         # Check status
npm run piston:test           # Test execution
npm run test:integration      # Run integration tests
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (auth, execute, projects)
│   ├── auth/             # Sign in/up pages
│   ├── dashboard/        # User dashboard
│   ├── editor/           # Solo editor
│   ├── collab/           # Collaborative editor
│   └── meet/             # Editor with Google Meet
├── contexts/             # Auth context
├── lib/                  # MongoDB config
└── models/               # User model

scripts/
├── piston-manager.sh              # Piston lifecycle management
├── install-piston-languages.sh    # Language installer
└── test-piston-integration.sh     # Integration tests

server.js                 # WebSocket server for collaboration
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy credentials to `.env.local`

## Troubleshooting

**Piston not working?**
```bash
# Check Docker is running
docker ps

# Restart Piston
npm run piston:stop
npm run piston:start

# Check logs
docker logs piston_api
```

**WebSocket connection failed?**
- Ensure `server.js` is running on port 1234
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`

**MongoDB connection error?**
- Verify connection string and password
- Check network access in MongoDB Atlas

## Documentation

- [Piston Setup](./PISTON_SETUP.md) - Detailed Piston configuration
- [Quick Start](./QUICK_START.md) - Quick reference guide
- [Integration Summary](./INTEGRATION_SUMMARY.md) - Complete integration details

## Stack

Next.js 16, React, Monaco Editor, Yjs, WebSocket, MongoDB, Piston API, Docker, TailwindCSS

## License

MIT
