"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "@/app/editor/LanguageSelector";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
// y-monaco is loaded dynamically to avoid "window is not defined" during SSR

// WebSocket URL – no throttle; y-websocket sends updates immediately (minimal latency)
const getWsUrl = () =>
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234"
    : "ws://localhost:1234";

function CollaborativeEditorContent() {
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

  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userCursors, setUserCursors] = useState([]);
  // Initialize Yjs + y-websocket (no Liveblocks) – no throttle; updates sent immediately
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
      // No throttle – y-websocket sends each Yjs update immediately (minimal latency)
      maxBackoffTime: 2000,
      // Request full state from server every 1s so editor reflects changes within 1 second
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

    // Language sync via Yjs map
    const ymap = ydoc.getMap("metadata");
    ymap.observe((event) => {
      if (event.keysChanged.has("language")) {
        const newLanguage = ymap.get("language");
        if (newLanguage) setLanguage(newLanguage);
      }
    });
    if (!ymap.get("language")) {
      ymap.set("language", "javascript");
      setLanguage("javascript");
    } else {
      setLanguage(ymap.get("language"));
    }

    // User presence via awareness with unique color per session
    const awareness = provider.awareness;
    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    
    awareness.setLocalStateField("user", {
      id: userId,
      name: userName,
      color: userColor,
    });

    // Update connected users and cursor positions
    const updatePresence = () => {
      const states = awareness.getStates();
      const users = [];
      const cursors = [];
      
      states.forEach((state, clientID) => {
        // Skip local user
        if (clientID === awareness.clientID) return;
        
        if (state.user) {
          users.push({ ...state.user, clientID });
          
          // Track cursor position
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
    updatePresence(); // Initial update

    // Clean up awareness on page unload/refresh
    const handleBeforeUnload = () => {
      if (provider.awareness) {
        provider.awareness.setLocalState(null);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('Cleaning up collaborative editor connection');
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clean up cursor widgets
      if (editorRef.current && cursorWidgetsRef.current) {
        cursorWidgetsRef.current.forEach((widget) => {
          try {
            editorRef.current.removeContentWidget(widget);
          } catch (e) {
            // Widget may already be removed
          }
        });
        cursorWidgetsRef.current.clear();
      }
      
      // Remove awareness state before destroying
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

  // Load y-monaco on client and set up binding when editor is ready
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const setupBinding = async () => {
      if (!ydocRef.current || !providerRef.current || bindingRef.current)
        return;

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

      // Dynamic import so y-monaco (which uses window) never runs on server
      const { MonacoBinding } = await import("y-monaco");
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;
      setIsReady(true);
      
      // Track cursor position and broadcast to other users
      let lastCursorUpdate = 0;
      const CURSOR_UPDATE_THROTTLE = 50; // ms
      
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
      
      // Also update on selection change
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

      // Render remote cursors with user names using content widgets
      const cursorWidgets = cursorWidgetsRef.current;
      const cursorData = new Map(); // Store cursor data to detect changes
      
      const updateCursorDecorations = () => {
        if (!provider.awareness) return;
        
        const states = provider.awareness.getStates();
        const currentClientIDs = new Set();
        
        // Add/update cursor widgets
        states.forEach((state, clientID) => {
          if (clientID === provider.awareness.clientID) return;
          if (!state.cursor || !state.user) return;
          
          currentClientIDs.add(clientID);
          
          const { line, column } = state.cursor;
          const { name, color } = state.user;
          
          // Check if cursor position changed
          const oldData = cursorData.get(clientID);
          const positionChanged = !oldData || oldData.line !== line || oldData.column !== column;
          
          if (positionChanged) {
            // Store new position
            cursorData.set(clientID, { line, column, name, color });
            
            // Remove old widget if exists
            if (cursorWidgets.has(clientID)) {
              editor.removeContentWidget(cursorWidgets.get(clientID));
            }
            
            // Create cursor widget with blinking animation
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
        
        // Remove widgets for disconnected users
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style jsx global>{`
        @keyframes cursorBlink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0.3;
          }
        }
        
        .remote-cursor-line {
          animation: cursorBlink 1s ease-in-out infinite;
        }
      `}</style>
      <nav className="flex items-center justify-between p-6 lg:px-8 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-2xl font-bold gradient-text-purple hover:scale-105 transition-transform duration-300"
          >
            CodeEditor
          </Link>
          <span className="text-white/60">|</span>
          <span className="text-white/80 font-medium">Live Collaboration (Yjs)</span>
          <span className="text-white/60">|</span>
          <span className="text-white/60 text-sm font-mono">{roomId}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/20">
            <div
              className={`w-2 h-2 rounded-full ${
                isReady ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-white/80 text-sm">
              {isReady ? " Synced" : " Connecting..."}
            </span>
          </div>
          <Link
            href="/editor"
            className="text-sm font-semibold text-white/90 hover:text-white transition-all"
          >
            ← Back to Editor
          </Link>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">🔑 Room ID:</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/20">
                <code className="text-white font-mono text-sm">{roomId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    alert("Room ID copied!");
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            {connectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white/90 font-medium">👥 Active Users:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {connectedUsers.map((u) => (
                    <div
                      key={u.clientID ?? u.id ?? u.name}
                      className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 flex items-center gap-2 hover:bg-white/15 transition-all"
                      title={`${u.name} - Line ${userCursors.find(c => c.clientID === u.clientID)?.position?.line || '?'}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: u.color || "#4ECDC4" }}
                      />
                      <span className="text-white/90 text-sm font-medium">{u.name || "Anonymous"}</span>
                      {userCursors.find(c => c.clientID === u.clientID)?.position && (
                        <span className="text-white/50 text-xs ml-1">
                          L{userCursors.find(c => c.clientID === u.clientID).position.line}
                        </span>
                      )}
                    </div>
                  ))}
                  <span className="text-white/60 text-sm font-medium px-2">
                    {connectedUsers.length} online
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
              alert("Link copied!");
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
          >
            Copy Full Link
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)]">
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: "var(--font-geist-mono), monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  lineNumbers: "on",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  readOnly: false,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col border-l border-white/10">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">Output</h3>
            <button
              onClick={runCode}
              disabled={isRunning}
              className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-medium text-sm ${
                isRunning ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isRunning ? "⏳ Running..." : "▶ Run Code"}
            </button>
          </div>
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg bg-gray-900 border border-white/10 shadow-2xl">
              <pre className="h-full p-4 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
                {output || "// Output will appear here\n// Click \"Run Code\" to execute"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollaborativeEditor() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin?redirect=/collab-live/" + roomId);
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

  return <CollaborativeEditorContent />;
}
