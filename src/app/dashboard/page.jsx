"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [useGoogleAuth, setUseGoogleAuth] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin?redirect=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load recent rooms from localStorage
    const stored = localStorage.getItem('recentRooms');
    if (stored) {
      setRecentRooms(JSON.parse(stored));
    }
  }, []);

  function generateRoomId() {
    return 'room-' + Math.random().toString(36).substring(2, 15);
  }

  async function createRoom() {
    setIsCreatingRoom(true);
    
    try {
      const roomId = generateRoomId();
      
      // Create Google Meet using API
      const response = await fetch('/api/meet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          roomName: roomName || 'Untitled Room',
          useOAuth: useGoogleAuth,
          userEmail: user.email
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response');
        // Fallback: create room without API
        const room = {
          id: roomId,
          name: roomName || 'Untitled Room',
          createdAt: new Date().toISOString(),
          createdBy: user.name,
          meetLink: null
        };

        const updated = [room, ...recentRooms.slice(0, 9)];
        setRecentRooms(updated);
        localStorage.setItem('recentRooms', JSON.stringify(updated));
        router.push(`/meet/${roomId}`);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        if (data.requiresAuth) {
          // Need Google authentication
          const authResponse = await fetch('/api/auth/google');
          const authData = await authResponse.json();
          
          if (authData.success) {
            // Redirect to Google OAuth
            window.location.href = authData.authUrl;
            return;
          }
        }
        
        alert(`Failed to create meeting: ${data.error}`);
        setIsCreatingRoom(false);
        return;
      }

      // Save to recent rooms
      const room = {
        id: roomId,
        name: roomName || 'Untitled Room',
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        meetLink: data.meetLink
      };

      const updated = [room, ...recentRooms.slice(0, 9)];
      setRecentRooms(updated);
      localStorage.setItem('recentRooms', JSON.stringify(updated));

      // Navigate to meet room
      router.push(`/meet/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      
      // Fallback: create room anyway
      const roomId = generateRoomId();
      const room = {
        id: roomId,
        name: roomName || 'Untitled Room',
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        meetLink: null
      };

      const updated = [room, ...recentRooms.slice(0, 9)];
      setRecentRooms(updated);
      localStorage.setItem('recentRooms', JSON.stringify(updated));
      
      // Navigate to meet room anyway
      router.push(`/meet/${roomId}`);
    }
  }

  function joinRoom() {
    if (!roomIdInput.trim()) {
      alert('Please enter a room ID');
      return;
    }
    router.push(`/meet/${roomIdInput.trim()}`);
  }

  function openRecentRoom(roomId) {
    router.push(`/meet/${roomId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold gradient-text-purple hover:scale-105 transition-transform duration-300">
            CodeEditor
          </Link>
          <span className="text-white/60">|</span>
          <span className="text-white/80 font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/editor"
            className="text-sm font-semibold text-white/90 hover:text-white transition-all"
          >
            Simple Editor
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-white/90 text-sm">{user.name}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome back, <span className="gradient-text-purple">{user.name}</span>! 👋
          </h1>
          <p className="text-white/70 text-lg">
            Start a collaborative coding session with video chat or join an existing room.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room Card */}
          <div className="glass rounded-2xl border border-white/20 p-8 hover:border-purple-500/50 transition-all duration-300 card-hover">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Room</h2>
                <p className="text-white/60 text-sm">Start a new session</p>
              </div>
            </div>
            <p className="text-white/70 mb-6">
              Create a new collaborative coding room with integrated Google Meet video chat. Share the room ID with your team to start coding together.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Create New Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="glass rounded-2xl border border-white/20 p-8 hover:border-indigo-500/50 transition-all duration-300 card-hover">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Join Room</h2>
                <p className="text-white/60 text-sm">Enter existing session</p>
              </div>
            </div>
            <p className="text-white/70 mb-6">
              Have a room ID? Join an existing collaborative session and start coding with your team right away.
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Existing Room
            </button>
          </div>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Rooms</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => openRecentRoom(room.id)}
                  className="glass rounded-xl border border-white/20 p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">{room.name}</h3>
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-white/60 text-sm mb-2">Room ID: {room.id}</p>
                  <p className="text-white/50 text-xs">
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-12 glass rounded-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">What's Included</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Google Meet Integration</h3>
                <p className="text-white/60 text-sm">Video chat with your team while coding together</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Real-time Collaboration</h3>
                <p className="text-white/60 text-sm">See cursor positions and edits in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Code Execution</h3>
                <p className="text-white/60 text-sm">Run code in 19+ languages instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-white/20 shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text-purple">Create New Room</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-white/90 mb-2">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isCreatingRoom && createRoom()}
                  placeholder="e.g., Team Project Meeting"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  autoFocus
                  disabled={isCreatingRoom}
                />
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGoogleAuth}
                    onChange={(e) => setUseGoogleAuth(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    disabled={isCreatingRoom}
                  />
                  <div>
                    <p className="text-sm text-white/90 font-medium">
                      Use Official Google Meet API
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Creates a calendar event with a proper Meet link (requires Google sign-in)
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-white/70 mt-2 space-y-1 list-disc list-inside">
                  <li>A unique room ID will be generated</li>
                  <li>Google Meet link will be created</li>
                  <li>Collaborative editor will be ready</li>
                  <li>Share the room ID with your team</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsCreatingRoom(false);
                  }}
                  disabled={isCreatingRoom}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={isCreatingRoom}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingRoom ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-white/20 shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text-purple">Join Room</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-white/90 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  placeholder="Enter room ID (e.g., room-abc123xyz)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                />
                <p className="mt-2 text-xs text-white/60">
                  💡 Get the room ID from the person who created the room
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={joinRoom}
                  disabled={!roomIdInput.trim()}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-medium ${
                    !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
