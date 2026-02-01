/**
 * WebSocket Server for Collaborative Editing with Yjs
 */

const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const map = require('lib0/map');

const PORT = process.env.WS_PORT || 1234;

// Store documents with their awareness
const docs = new Map();
const conns = new Map();

// Create HTTP server
const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Yjs WebSocket Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Get or create document with awareness
const getYDoc = (docname) => map.setIfUndefined(docs, docname, () => {
    const doc = new Y.Doc();
    doc.gc = true;
    const awareness = new awarenessProtocol.Awareness(doc);
    return { doc, awareness };
});

// Setup WebSocket connection
const setupWSConnection = (conn, req, docName) => {
    conn.binaryType = 'arraybuffer';
    const { doc, awareness } = getYDoc(docName);

    conns.set(conn, { doc, awareness, docName, clientIDs: [] });

    // Send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // messageSync
    syncProtocol.writeSyncStep1(encoder, doc);
    conn.send(encoding.toUint8Array(encoder));
    console.log(`Sent initial sync to new client in room ${docName}`);

    // Send awareness states from all clients
    const awarenessStates = awareness.getStates();
    if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 1); // messageAwareness
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
        conn.send(encoding.toUint8Array(encoder));
        console.log(`Sent awareness states (${awarenessStates.size} users) to new client in room ${docName}`);
    }

    // Handle incoming messages
    conn.on('message', (message) => {
        try {
            const encoder = encoding.createEncoder();
            const decoder = decoding.createDecoder(new Uint8Array(message));
            const messageType = decoding.readVarUint(decoder);

            console.log(`Received message type ${messageType} for room ${docName}`);

            switch (messageType) {
                case 0: // messageSync
                    encoding.writeVarUint(encoder, 0);
                    syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
                    if (encoding.length(encoder) > 1) {
                        conn.send(encoding.toUint8Array(encoder));
                        console.log(`Sent sync response for room ${docName}`);
                    }
                    break;
                case 1: { // messageAwareness
                    const update = decoding.readVarUint8Array(decoder);
                    const connData = conns.get(conn);
                    if (connData) {
                        const dec = decoding.createDecoder(update);
                        const len = decoding.readVarUint(dec);
                        const clientIDsFromUpdate = [];
                        for (let i = 0; i < len; i++) {
                            clientIDsFromUpdate.push(decoding.readVarUint(dec));
                            decoding.readVarUint(dec);
                            decoding.readVarString(dec);
                        }
                        connData.clientIDs = clientIDsFromUpdate;
                    }
                    awarenessProtocol.applyAwarenessUpdate(awareness, update, conn);
                    console.log(`Applied awareness update for room ${docName}`);
                    break;
                }
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    // Broadcast awareness changes to all connections in the room (so everyone sees join/leave)
    const awarenessChangeHandler = ({ added, updated, removed }) => {
        const changedClients = added.concat(updated, removed);
        if (changedClients.length > 0) {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, 1);
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients));
            const buff = encoding.toUint8Array(encoder);

            conns.forEach((connData, c) => {
                if (c.readyState === WebSocket.OPEN && connData.docName === docName) {
                    c.send(buff);
                }
            });
        }
    };

    const updateHandler = (update, origin) => {
        console.log(`Document update in room ${docName}, broadcasting to other clients`);
        if (origin !== conn) {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, 0);
            syncProtocol.writeUpdate(encoder, update);
            const buff = encoding.toUint8Array(encoder);

            let broadcastCount = 0;
            conns.forEach((connData, c) => {
                if (c !== conn && c.readyState === WebSocket.OPEN && connData.docName === docName) {
                    c.send(buff);
                    broadcastCount++;
                }
            });
            console.log(`Broadcasted update to ${broadcastCount} clients in room ${docName}`);
        }
    };

    doc.on('update', updateHandler);
    awareness.on('change', awarenessChangeHandler);

    // Cleanup on close: remove this connection's clientID(s) from awareness so user count doesn't grow on refresh
    conn.on('close', () => {
        doc.off('update', updateHandler);
        awareness.off('change', awarenessChangeHandler);
        const connData = conns.get(conn);
        if (connData && connData.clientIDs && connData.clientIDs.length > 0) {
            awarenessProtocol.removeAwarenessStates(awareness, connData.clientIDs, 'disconnect');
            console.log(`Removed awareness for client(s) ${connData.clientIDs.join(', ')} in room ${docName}`);
        }
        conns.delete(conn);

        // Clean up empty documents
        const hasOtherConnections = Array.from(conns.values()).some(c => c.docName === docName);
        if (!hasOtherConnections) {
            docs.delete(docName);
            console.log(`Document ${docName} cleaned up (no more connections)`);
        } else {
            console.log(`User disconnected from ${docName}, ${Array.from(conns.values()).filter(c => c.docName === docName).length} users remaining`);
        }
    });
};

wss.on('connection', (conn, req) => {
    console.log('New WebSocket connection');

    // Extract room ID from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.pathname.substring(1); // Remove leading slash
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');

    if (!roomId) {
        console.log('Connection rejected: No room ID provided');
        conn.close(1008, 'Room ID required');
        return;
    }

    if (!userId || !userName) {
        console.log('Connection rejected: Authentication required');
        conn.close(1008, 'Authentication required');
        return;
    }

    console.log(`User ${userName} (${userId}) joined room: ${roomId}`);

    // Setup Yjs WebSocket connection
    setupWSConnection(conn, req, roomId);

    // Handle errors
    conn.on('error', (error) => {
        console.error(`WebSocket error for user ${userName}:`, error);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Yjs WebSocket Server running on ws://localhost:${PORT}`);
    console.log(`📡 Ready for collaborative editing connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
