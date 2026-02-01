"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/app/editor/LanguageSelector';

export default function CollaborativeEditor() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const roomId = params.roomId;
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const MonacoBindingRef = useRef(null);
  
  const [language, setLanguage] = useState('javascript');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [roomInfo, setRoomInfo] = useState(null);
  const [isMonacoBindingReady, setIsMonacoBindingReady] = useState(false);
  const [isProviderSynced, setIsProviderSynced] = useState(false);

  // Load MonacoBinding dynamically (client-side only)
  useEffect(() => {
    import('y-monaco').then((module) => {
      MonacoBindingRef.current = module.MonacoBinding;
      setIsMonacoBindingReady(true);
      console.log('MonacoBinding loaded');
    });
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin?redirect=/collab/' + roomId);
    }
  }, [user, loading, router, roomId]);

  // Initialize Yjs and WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    console.log('Initializing collaborative editor for room:', roomId);
    setConnectionStatus('connecting');

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebSocket provider
    // Use window location for WebSocket URL if in browser
    const wsUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:1234`)
      : 'ws://localhost:1234';
    
    console.log('Connecting to WebSocket:', wsUrl, 'Room:', roomId);
    console.log('User:', user.id, user.name);
    
    const provider = new WebsocketProvider(
      wsUrl,
      roomId,
      ydoc,
      {
        params: {
          userId: user.id,
          userName: user.name
        },
        // Enable reconnect
        reconnect: true,
        // Set max reconnect attempts
        maxReconnectAttempts: 10,
        // Reconnect delay
        reconnectDelay: 1000,
        // WebSocket options
        WebSocketPolyfill: typeof window !== 'undefined' ? WebSocket : require('ws')
      }
    );
    providerRef.current = provider;
    
    // Log connection events for debugging
    provider.on('connection-error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    provider.on('connection-close', (event) => {
      console.log('WebSocket connection closed:', event);
    });

    // Connection status handlers
    provider.on('status', (event) => {
      console.log('WebSocket status:', event.status);
      setIsConnected(event.status === 'connected');
      setConnectionStatus(event.status);
      
      if (event.status === 'connected') {
        console.log('WebSocket connected successfully');
      } else if (event.status === 'disconnected') {
        console.log('WebSocket disconnected');
      }
    });

    provider.on('sync', (isSynced) => {
      console.log('Sync status:', isSynced);
      if (isSynced) {
        setConnectionStatus('synced');
        setIsProviderSynced(true);
        // Try to setup binding if editor is already mounted
        if (editorRef.current && MonacoBindingRef.current && !bindingRef.current) {
          console.log('Provider synced, setting up binding now');
          setupBinding(editorRef.current);
        }
      } else {
        setIsProviderSynced(false);
      }
    });

    // Awareness for tracking active users
    const awareness = provider.awareness;
    
    // Set local user info
    awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: generateUserColor(user.id)
    });

    // Track awareness changes
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      const users = states
        .map(state => state.user)
        .filter(u => u && u.id !== user.id);
      setActiveUsers(users);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up collaborative editor');
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, [user, roomId, router]);

  // Setup binding when provider syncs and editor is ready
  useEffect(() => {
    if (isProviderSynced && editorRef.current && MonacoBindingRef.current && !bindingRef.current) {
      console.log('Provider synced and editor ready, setting up binding');
      setupBinding(editorRef.current);
    }
  }, [isProviderSynced, isMonacoBindingReady]);

  // Setup Monaco binding when editor is ready
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (!ydocRef.current || !providerRef.current) {
      console.error('Yjs not initialized');
      return;
    }

    // Wait for MonacoBinding to load if not ready
    if (!MonacoBindingRef.current) {
      console.log('Waiting for MonacoBinding to load...');
      const checkInterval = setInterval(() => {
        if (MonacoBindingRef.current) {
          clearInterval(checkInterval);
          // Check if provider is synced before setting up binding
          if (isProviderSynced || providerRef.current.wsconnected) {
            setupBinding(editor);
          } else {
            console.log('Waiting for provider to sync before setting up binding...');
          }
        }
      }, 100);
      return;
    }

    // Check if provider is synced before setting up binding
    if (isProviderSynced || providerRef.current.wsconnected) {
      setupBinding(editor);
    } else {
      console.log('Editor mounted, waiting for provider to sync...');
      // Set up a listener to create binding once synced
      const syncListener = (synced) => {
        if (synced && !bindingRef.current) {
          setupBinding(editor);
          providerRef.current.off('sync', syncListener);
        }
      };
      providerRef.current.on('sync', syncListener);
    }
  }

  function setupBinding(editor) {
    if (bindingRef.current) {
      console.log('Binding already exists');
      return;
    }

    if (!MonacoBindingRef.current) {
      console.error('MonacoBinding not loaded yet');
      return;
    }

    if (!ydocRef.current || !providerRef.current) {
      console.error('Yjs or provider not initialized');
      return;
    }

    // Get or create shared text type
    const ytext = ydocRef.current.getText('monaco');

    // Ensure editor model exists
    if (!editor.getModel()) {
      console.error('Editor model not available');
      return;
    }

    try {
      // Create Monaco binding with proper error handling
      const binding = new MonacoBindingRef.current(
        ytext,
        editor.getModel(),
        new Set([editor]),
        providerRef.current.awareness
      );
      bindingRef.current = binding;

      console.log('Monaco binding created successfully');
      
      // Force editor to update
      editor.getModel().setValue(ytext.toString());
      
      // Listen for Yjs text changes to ensure real-time updates
      ytext.observe((event) => {
        console.log('Yjs text changed:', event.changes);
        // The binding should handle this automatically, but we log for debugging
      });

      // Also listen for document updates to ensure sync
      ydocRef.current.on('update', (update, origin) => {
        if (origin !== providerRef.current) {
          console.log('Document updated from remote, applying changes');
        }
      });

      editor.focus();
    } catch (error) {
      console.error('Error creating Monaco binding:', error);
    }
  }

  function handleLanguageChange(newLanguage) {
    setLanguage(newLanguage);
    
    // Update language in awareness so others can see
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('language', newLanguage);
    }
  }

  async function runCode() {
    if (!editorRef.current) return;

    setIsRunning(true);
    const code = editorRef.current.getValue();
    const startTime = Date.now();
    setOutput("🔄 Executing code...\n");

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (data.success && data.result) {
        let formattedOutput = `🚀 Code Execution Results\n`;
        formattedOutput += `⏱️ Execution time: ${executionTime}ms\n`;
        formattedOutput += `🔧 Language: ${language}\n`;
        formattedOutput += `${'='.repeat(50)}\n\n`;
        formattedOutput += data.result.output;
        setOutput(formattedOutput);
      } else {
        setOutput(`❌ Execution Failed\n\nError: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setOutput(`🌐 Network Error\n\n❌ ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }

  function copyRoomLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard! Share it with others to collaborate.');
  }

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard! Share it with others so they can join.');
  }

  function generateUserColor(userId) {
    // Generate consistent color based on user ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
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
          <span className="text-white/80 font-medium">Collaborative Room</span>
          <span className="text-white/60">|</span>
          <span className="text-white/60 text-sm font-mono">{roomId}</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/20">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'synced' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connected' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-white/80 text-sm capitalize">{connectionStatus}</span>
          </div>

          {/* Active Users */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/20">
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-white/80 text-sm">{activeUsers.length + 1} online</span>
          </div>

          <Link
            href="/editor"
            className="text-sm font-semibold leading-6 text-white/90 hover:text-white transition-all duration-300"
          >
            ← Back to Editor
          </Link>
        </div>
      </nav>

      {/* Collaboration Info Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Room ID Display */}
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">🔑 Room ID:</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/20">
                <code className="text-white font-mono text-sm">{roomId}</code>
                <button
                  onClick={copyRoomId}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Copy Room ID"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collaborators */}
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">👥 Collaborators:</span>
              <div className="flex -space-x-2">
                {/* Current user */}
                <div
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: generateUserColor(user.id) }}
                  title={`${user.name} (You)`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {/* Other users */}
                {activeUsers.map((u, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: u.color }}
                    title={u.name}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button
            onClick={copyRoomLink}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy Full Link
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Panel - Editor */}
        <div className="flex-1 flex flex-col">
          {/* Language Selector */}
          <div className="p-4">
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          
          {/* Monaco Editor */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: 'var(--font-geist-mono), "Fira Code", monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col border-l border-white/10">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">Output</h3>
            <button
              onClick={runCode}
              disabled={isRunning || !isConnected}
              className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 font-medium text-sm ${
                isRunning || !isConnected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isRunning ? '⏳ Running...' : '▶ Run Code'}
            </button>
          </div>
          
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg bg-gray-900 border border-white/10 shadow-2xl">
              <pre className="h-full p-4 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
                {output || '// Output will appear here\n// Click "Run Code" to execute'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
