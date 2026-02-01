# 🚀 Collaborative Code Editor with Google Meet Integration

A real-time collaborative code editor built with Next.js, featuring integrated Google Meet for seamless pair programming and team collaboration.

## ✨ Features

### 🎯 Core Features
- **Real-time Collaborative Editing** - Multiple users can edit code simultaneously with live cursor tracking
- **Google Meet Integration** - Built-in video conferencing for team collaboration
- **Multi-language Support** - Execute code in JavaScript, Python, Java, C++, and more
- **User Authentication** - Secure login with MongoDB-backed user management
- **Guest Mode** - Try the editor without signing up
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

### 👥 Collaboration Features
- Live cursor positions with user names and colors
- Real-time presence indicators showing online users
- Shared code execution and output
- Room-based collaboration with unique room IDs
- Persistent Meet URLs - All users join the same Google Meet session

### 🎨 UI/UX Features
- Resizable panels (Meet, Editor, Output)
- Dark mode interface with gradient accents
- Monaco Editor with syntax highlighting
- Language selector with 20+ programming languages
- Smooth animations and transitions

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TailwindCSS
- **Editor**: Monaco Editor (VS Code's editor)
- **Real-time Sync**: Yjs, y-websocket, y-monaco
- **Authentication**: Custom auth with bcrypt
- **Database**: MongoDB with Mongoose
- **Video**: Google Meet API
- **Code Execution**: Piston API
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database (local or MongoDB Atlas)
- Google Cloud Console account (for Meet integration)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd my-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Google OAuth (for Meet integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# WebSocket Server
NEXT_PUBLIC_WS_URL=ws://localhost:1234

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the WebSocket Server

```bash
node server.js
```

The WebSocket server will run on `ws://localhost:1234`

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Getting API Keys

### MongoDB
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string from "Connect" → "Connect your application"

### Google OAuth (for Meet)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret

See [HOW_TO_GET_GOOGLE_CREDENTIALS.md](./HOW_TO_GET_GOOGLE_CREDENTIALS.md) for detailed instructions.

## 📖 Usage

### For Guest Users
1. Visit the homepage
2. Click "Try as Guest"
3. Use the simple code editor (no collaboration features)

### For Authenticated Users
1. Sign up or sign in
2. Go to Dashboard
3. Create a new room or join an existing one
4. Share the room ID with teammates
5. Collaborate in real-time with integrated Google Meet

### Creating a Collaborative Session
1. Click "Create Room" on the dashboard
2. A Google Meet link will be generated
3. Copy the Meet URL and save it (first user only)
4. Share the room ID with your team
5. All users will join the same Meet session automatically

### Resizing Panels
- Hover over the divider between panels
- Click and drag to resize
- Works on desktop only (mobile has fixed layouts)

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── editor/           # Simple editor
│   │   ├── meet/             # Collaborative editor with Meet
│   │   └── components/       # Shared components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities and configs
│   └── models/               # MongoDB models
├── public/                   # Static assets
├── server.js                 # WebSocket server
└── .env.local               # Environment variables (not in git)
```

## 🎯 Key Features Explained

### Real-time Collaboration
Uses Yjs CRDT (Conflict-free Replicated Data Type) with WebSocket for real-time synchronization without conflicts. Changes are instantly propagated to all connected users through a custom WebSocket server.

### Cursor Tracking
Each user gets a unique color and their cursor position is visible to others with their name displayed above it.

### Google Meet Integration
- First user creates a Meet room and saves the URL
- Subsequent users automatically join the same meeting
- Meet opens in a new window for better screen management

### Code Execution
Powered by Piston API, supporting 20+ languages with sandboxed execution for security.

## 🔒 Security

- Passwords hashed with bcrypt
- Environment variables for sensitive data
- MongoDB connection with authentication
- OAuth 2.0 for Google integration
- Input sanitization for code execution

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Ensure `server.js` is running on port 1234
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`

### Google Meet Not Working
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure Google Calendar API is enabled

### MongoDB Connection Error
- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions

## 📚 Additional Documentation

- [Authentication Guide](./AUTH_GUIDE.md)
- [Google Meet Setup](./GOOGLE_MEET_INTEGRATION.md)
- [MongoDB Integration](./MONGODB_INTEGRATION.md)
- [Troubleshooting](./TROUBLESHOOTING_GOOGLE_AUTH.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Yjs](https://yjs.dev/) - CRDT framework for real-time collaboration
- [Piston](https://github.com/engineer-man/piston) - Code execution engine
- [TailwindCSS](https://tailwindcss.com/) - Styling

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for developers who love to collaborate
