"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/app/editor/LanguageSelector';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const getWsUrl = () =>
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234"
    : "ws://localhost:1234";

function MeetRoomContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const roomId = params.roomId;
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const cursorWidgetsRef = useRef(new Map());
  
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userCursors, setUserCursors] = useState([]);
  const [showMeet, setShowMeet] = useState(true);
  const [meetUrl, setMeetUrl] = useState('');
  const [loadingMeet, setLoadingMeet] = useState(true);
  const [meetOpened, setMeetOpened] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [needsMeetUrl, setNeedsMeetUrl] = useState(false);
  const [userMeetUrl, setUserMeetUrl] = useState('');
  
  // Resizable panel widths
  const [meetPanelWidth, setMeetPanelWidth] = useState(384); // 96 * 4 = 384px (w-96)
  const [outputPanelWidth, setOutputPanelWidth] = useState(384);
  const [isResizingMeet, setIsResizingMeet] = useState(false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const resizeStartRef = useRef({ x: 0, width: 0 });
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch Google Meet URL from API
  useEffect(() => {
    async function fetchMeetLink() {
      try {
        const response = await fetch(`/api/meet/create?roomId=${roomId}`);
        const data = await response.json();
        
        if (data.success && data.meetLink && data.meetLink !== 'https://meet.google.com/new') {
          // Existing Meet link found - use it
          setMeetUrl(data.meetLink);
          setIsCreator(false);
          
          // Automatically open Meet in new window
          if (!meetOpened) {
            window.open(data.meetLink, '_blank', 'width=1200,height=800');
            setMeetOpened(true);
          }
        } else {
          // No Meet link yet - this user needs to create one
          setIsCreator(true);
          setNeedsMeetUrl(true);
          setMeetUrl('https://meet.google.com/new');
        }
      } catch (error) {
        console.error('Error fetching Meet link:', error);
        setIsCreator(true);
        setNeedsMeetUrl(true);
        setMeetUrl('https://meet.google.com/new');
      } finally {
        setLoadingMeet(false);
      }
    }

    if (roomId) {
      fetchMeetLink();
    }
  }, [roomId, meetOpened]);

  // Handle Meet panel resize
  useEffect(() => {
    if (!isResizingMeet) return;

    const handleMouseMove = (e) => {
      const delta = e.clientX - resizeStartRef.current.x;
      const newWidth = Math.max(250, Math.min(600, resizeStartRef.current.width + delta));
      setMeetPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingMeet(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingMeet]);

  // Handle Output panel resize
  useEffect(() => {
    if (!isResizingOutput) return;

    const handleMouseMove = (e) => {
      const delta = resizeStartRef.current.x - e.clientX;
      const newWidth = Math.max(250, Math.min(800, resizeStartRef.current.width + delta));
      setOutputPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingOutput(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingOutput]);

  // Save Meet URL to database
  async function saveMeetUrl() {
    if (!userMeetUrl.trim()) {
      alert('Please enter the Google Meet URL');
      return;
    }

    try {
      const response = await fetch('/api/meet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          meetLink: userMeetUrl.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMeetUrl(userMeetUrl.trim());
        setNeedsMeetUrl(false);
        alert('✅ Meet URL saved! Your teammates will now join the same meeting.');
      } else {
        alert('Failed to save Meet URL: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving Meet URL:', error);
      alert('Failed to save Meet URL. Please try again.');
    }
  }

  // Initialize Yjs with WebSocket
  useEffect(() => {
    if (!user || !roomId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const userId = String(user._id || user.id || "anon");
    const userName = user.name || user.email || "Anonymous";
    const wsUrl = getWsUrl();

    const provider = new WebsocketProvider(wsUrl, roomId, ydoc, {
      connect: true,
      params: { userId, userName },
      maxBackoffTime: 2000,
      resyncInterval: 1000,
    });
    providerRef.current = provider;

    provider.on("status", (event) => {
      if (event.status === "connected") {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    });

    provider.on("sync", (isSynced) => {
      if (isSynced) setIsReady(true);
    });

    // Language sync
    const ymap = ydoc.getMap("metadata");
    ymap.observe((event) => {
      if (event.keysChanged.has("language")) {
        const newLanguage = ymap.get("language");
        if (newLanguage) setLanguage(newLanguage);
      }
    });
    if (!ymap.get("language")) {
      ymap.set("language", "javascript");
    } else {
      setLanguage(ymap.get("language"));
    }

    // User presence
    const awareness = provider.awareness;
    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    
    awareness.setLocalStateField("user", {
      id: userId,
      name: userName,
      color: userColor,
    });

    const updatePresence = () => {
      const states = awareness.getStates();
      const users = [];
      const cursors = [];
      
      states.forEach((state, clientID) => {
        if (clientID === awareness.clientID) return;
        
        if (state.user) {
          users.push({ ...state.user, clientID });
          
          if (state.cursor) {
            cursors.push({
              clientID,
              name: state.user.name,
              color: state.user.color,
              position: state.cursor,
            });
          }
        }
      });
      
      setConnectedUsers(users);
      setUserCursors(cursors);
    };

    awareness.on("change", updatePresence);
    updatePresence();

    const handleBeforeUnload = () => {
      if (provider.awareness) {
        provider.awareness.setLocalState(null);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (editorRef.current && cursorWidgetsRef.current) {
        cursorWidgetsRef.current.forEach((widget) => {
          try {
            editorRef.current.removeContentWidget(widget);
          } catch (e) {}
        });
        cursorWidgetsRef.current.clear();
      }
      
      if (provider.awareness) {
        provider.awareness.setLocalState(null);
      }
      
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      provider.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [user, roomId]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const setupBinding = async () => {
      if (!ydocRef.current || !providerRef.current || bindingRef.current) return;

      const ydoc = ydocRef.current;
      const provider = providerRef.current;
      const ytext = ydoc.getText("monaco");
      const model = editor.getModel();
      if (!model) return;

      const ytextStr = ytext.toString();
      if (ytextStr && ytextStr !== model.getValue()) {
        model.setValue(ytextStr);
      } else if (!ytextStr && model.getValue()) {
        ytext.insert(0, model.getValue());
      }

      const { MonacoBinding } = await import("y-monaco");
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;
      setIsReady(true);
      
      // Track cursor position
      let lastCursorUpdate = 0;
      const CURSOR_UPDATE_THROTTLE = 50;
      
      editor.onDidChangeCursorPosition((e) => {
        if (provider.awareness) {
          const now = Date.now();
          if (now - lastCursorUpdate > CURSOR_UPDATE_THROTTLE) {
            provider.awareness.setLocalStateField("cursor", {
              line: e.position.lineNumber,
              column: e.position.column,
            });
            lastCursorUpdate = now;
          }
        }
      });
      
      editor.onDidChangeCursorSelection((e) => {
        if (provider.awareness) {
          const now = Date.now();
          if (now - lastCursorUpdate > CURSOR_UPDATE_THROTTLE) {
            provider.awareness.setLocalStateField("cursor", {
              line: e.selection.startLineNumber,
              column: e.selection.startColumn,
            });
            lastCursorUpdate = now;
          }
        }
      });

      // Render remote cursors
      const cursorWidgets = cursorWidgetsRef.current;
      const cursorData = new Map();
      
      const updateCursorDecorations = () => {
        if (!provider.awareness) return;
        
        const states = provider.awareness.getStates();
        const currentClientIDs = new Set();
        
        states.forEach((state, clientID) => {
          if (clientID === provider.awareness.clientID) return;
          if (!state.cursor || !state.user) return;
          
          currentClientIDs.add(clientID);
          
          const { line, column } = state.cursor;
          const { name, color } = state.user;
          
          const oldData = cursorData.get(clientID);
          const positionChanged = !oldData || oldData.line !== line || oldData.column !== column;
          
          if (positionChanged) {
            cursorData.set(clientID, { line, column, name, color });
            
            if (cursorWidgets.has(clientID)) {
              editor.removeContentWidget(cursorWidgets.get(clientID));
            }
            
            const domNode = document.createElement('div');
            domNode.style.position = 'absolute';
            domNode.style.zIndex = '10000';
            domNode.style.pointerEvents = 'none';
            domNode.innerHTML = `
              <div style="position: relative;">
                <div class="remote-cursor-line" style="
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  width: 2px;
                  height: 20px;
                  background-color: ${color};
                  animation: cursorBlink 1s ease-in-out infinite;
                "></div>
                <div style="
                  position: absolute;
                  bottom: 20px;
                  left: 0;
                  background-color: ${color};
                  color: white;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 11px;
                  font-weight: 600;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${name}</div>
              </div>
            `;
            
            const widget = {
              getId: () => `cursor.${clientID}`,
              getDomNode: () => domNode,
              getPosition: () => ({
                position: { lineNumber: line, column: column },
                preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
              })
            };
            
            editor.addContentWidget(widget);
            cursorWidgets.set(clientID, widget);
          }
        });
        
        cursorWidgets.forEach((widget, clientID) => {
          if (!currentClientIDs.has(clientID)) {
            editor.removeContentWidget(widget);
            cursorWidgets.delete(clientID);
            cursorData.delete(clientID);
          }
        });
      };
      
      provider.awareness.on("change", updateCursorDecorations);
      updateCursorDecorations();

      editor.focus();
    };

    if (ydocRef.current && providerRef.current) {
      setupBinding();
    } else {
      const t = setInterval(() => {
        if (ydocRef.current && providerRef.current) {
          clearInterval(t);
          setupBinding();
        }
      }, 50);
    }
  }

  function handleLanguageChange(newLanguage) {
    setLanguage(newLanguage);
    if (ydocRef.current) {
      ydocRef.current.getMap("metadata").set("language", newLanguage);
    }
  }

  async function runCode() {
    if (!editorRef.current) return;
    setIsRunning(true);
    const code = editorRef.current.getValue();
    setOutput("🔄 Executing code...\n");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setOutput(`🚀 Code Execution Results\n\n${data.result.output}`);
      } else {
        setOutput(`❌ Execution Failed\n\nError: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setOutput(`🌐 Network Error\n\n❌ ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied! Share it with others to collaborate.');
  }

  function copyMeetLink() {
    navigator.clipboard.writeText(meetUrl);
    alert('Google Meet link copied!');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <style jsx global>{`
        @keyframes cursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
        .remote-cursor-line {
          animation: cursorBlink 1s ease-in-out infinite;
        }
        .resize-handle {
          position: relative;
          width: 8px;
          background: transparent;
          cursor: col-resize;
          user-select: none;
          transition: background-color 0.2s;
          z-index: 1;
          flex-shrink: 0;
        }
        .resize-handle:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .resize-handle:active {
          background: rgba(139, 92, 246, 0.8);
        }
        .resize-handle::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 40px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          opacity: 1;
          transition: opacity 0.2s, background 0.2s;
        }
        .resize-handle:hover::before {
          opacity: 1;
          background: rgba(139, 92, 246, 0.8);
        }
      `}</style>

      {/* Navigation */}
      <nav className="flex items-center justify-between p-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold gradient-text-purple hover:scale-105 transition-transform duration-300">
            CodeEditor
          </Link>
          <span className="text-white/60">|</span>
          <span className="text-white/80 font-medium text-sm">Collaborative Session</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/20">
            <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <span className="text-white/80 text-xs">{isReady ? 'Connected' : 'Connecting...'}</span>
          </div>

          <Link href="/dashboard" className="text-sm font-semibold text-white/90 hover:text-white transition-all">
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Room Info Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium text-sm">🔑 Room:</span>
              <div className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-lg border border-white/20">
                <code className="text-white font-mono text-xs">{roomId}</code>
                <button onClick={copyRoomId} className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {connectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white/90 font-medium text-sm">👥</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {connectedUsers.map((u) => (
                    <div
                      key={u.clientID ?? u.id}
                      className="px-2 py-1 bg-white/10 rounded-lg border border-white/20 flex items-center gap-1"
                      title={`${u.name} - Line ${userCursors.find(c => c.clientID === u.clientID)?.position?.line || '?'}`}
                    >
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: u.color }}></div>
                      <span className="text-white/90 text-xs font-medium">{u.name}</span>
                    </div>
                  ))}
                  <span className="text-white/60 text-xs ml-1">{connectedUsers.length} online</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowMeet(!showMeet)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-xs font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {showMeet ? 'Hide' : 'Show'} Meet Panel
            </button>
            <button 
              onClick={() => window.open(meetUrl, '_blank', 'width=1200,height=800')} 
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-xs font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Meet
            </button>
            <button onClick={copyMeetLink} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Meet Link
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Meet Info Panel */}
        {showMeet && (
          <>
            <div 
              className="border-r lg:border-r border-b lg:border-b-0 border-white/10 flex flex-col bg-gray-900/50 w-full lg:w-auto"
              style={{ 
                width: isLargeScreen ? `${meetPanelWidth}px` : '100%',
                minWidth: isLargeScreen ? '250px' : '100%',
                maxWidth: isLargeScreen ? '600px' : '100%',
                flexShrink: 0,
                height: isLargeScreen ? 'auto' : '300px'
              }}
            >
            <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-white font-semibold text-sm">Google Meet</h3>
              <button
                onClick={() => setShowMeet(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-start p-4 text-center overflow-y-auto">
              <div className="w-full max-w-md">
              {loadingMeet ? (
                <div>
                  <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-white/70 text-sm">Opening Google Meet...</p>
                </div>
              ) : needsMeetUrl ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">You're the First One Here! 🎉</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Create a Google Meet room and share the link so everyone joins the same meeting.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        window.open('https://meet.google.com/new', '_blank', 'width=1200,height=800');
                        setMeetOpened(true);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Google Meet Room
                    </button>

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-white/80 text-xs font-medium mb-2">📋 After creating the meeting:</p>
                      <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside mb-3">
                        <li>Click "Create Google Meet Room" above</li>
                        <li>Join the meeting in the new window</li>
                        <li>Copy the Meet URL from your browser address bar</li>
                        <li>Paste it below and click "Save"</li>
                      </ol>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={userMeetUrl}
                          onChange={(e) => setUserMeetUrl(e.target.value)}
                          placeholder="Paste Meet URL here (e.g., https://meet.google.com/abc-defg-hij)"
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={saveMeetUrl}
                          disabled={!userMeetUrl.trim()}
                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💾 Save Meet URL for Everyone
                        </button>
                      </div>
                    </div>

                    <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-white/70 text-xs">
                        <strong>💡 Important:</strong> Once you save the Meet URL, all teammates joining this room will automatically join the same meeting!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Google Meet Opened</h3>
                    <p className="text-white/60 text-sm mb-4">
                      A new Google Meet room has been created. Click the button below to join or rejoin the meeting.
                    </p>
                  </div>

                  <button
                    onClick={() => window.open(meetUrl, '_blank', 'width=1200,height=800')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Join Google Meet
                  </button>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-white/80 text-xs font-medium mb-1">📋 How to share with your team:</p>
                      <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                        <li>Click "Join Google Meet" above</li>
                        <li>Once in the meeting, copy the Meet URL from your browser</li>
                        <li>Share that URL with your teammates</li>
                        <li>Everyone uses the same Room ID: <code className="bg-white/10 px-1 rounded">{roomId}</code></li>
                      </ol>
                    </div>

                    
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
          
          {/* Resize Handle for Meet Panel - Only on large screens */}
          {isLargeScreen && (
            <div
              className="resize-handle"
              onMouseDown={(e) => {
                resizeStartRef.current = { x: e.clientX, width: meetPanelWidth };
                setIsResizingMeet(true);
              }}
              style={{ 
                cursor: 'col-resize',
                zIndex: isResizingMeet ? 30 : 1
              }}
            />
          )}
          </>
        )}

        {/* Editor Section */}
        <div className="flex-1 flex flex-col lg:flex-row w-[50%]">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col w-full lg:w-auto" style={{ height: isLargeScreen ? 'auto' : '400px' }}>
            <div className="p-3">
              <LanguageSelector selectedLanguage={language} onLanguageChange={handleLanguageChange} />
            </div>
            
            <div className="flex-1 p-3">
              <div className="h-full rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={language}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: 11,
                    fontFamily: 'var(--font-geist-mono), monospace',
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

          {/* Resize Handle for Output Panel - Only on large screens */}
          {isLargeScreen && (
            <div
              className="resize-handle"
              onMouseDown={(e) => {
                resizeStartRef.current = { x: e.clientX, width: outputPanelWidth };
                setIsResizingOutput(true);
              }}
              style={{ 
                cursor: 'col-resize',
                zIndex: isResizingOutput ? 30 : 1
              }}
            />
          )}

          {/* Output Panel */}
          <div 
            className="flex flex-col border-l lg:border-l border-t lg:border-t-0 border-white/10 w-full lg:w-auto"
            style={{ 
              width: isLargeScreen ? `${outputPanelWidth}px` : '100%',
              minWidth: isLargeScreen ? '250px' : '100%',
              maxWidth: isLargeScreen ? '800px' : '100%',
              flexShrink: 0,
              height: isLargeScreen ? 'auto' : '300px'
            }}
          >
            <div className="p-3 flex items-center justify-between border-b border-white/10 relative z-10 bg-gray-900/50">
              <h3 className="text-white font-semibold text-sm">Output</h3>
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-medium text-xs relative z-20 ${
                  isRunning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isRunning ? '⏳ Running...' : '▶ Run Code'}
              </button>
            </div>
            
            <div className="flex-1 p-3">
              <div className="h-full rounded-lg bg-gray-900 border border-white/10 shadow-2xl">
                <pre className="h-full p-3 text-green-400 font-mono text-xs overflow-auto whitespace-pre-wrap">
                  {output || '// Output will appear here\n// Click "Run Code" to execute'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetRoom() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin?redirect=/meet/' + roomId);
    }
  }, [user, loading, router, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return <MeetRoomContent />;
}
