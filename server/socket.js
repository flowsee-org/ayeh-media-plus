import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';
import { JWT_SECRET } from './lib/jwt.js';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

export let io = null;

// In-memory room state matching Base44's LiveRoom actor with interactive Co-host support
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      broadcasterId: null,
      broadcasterSocketId: null,
      activeSpeaker: null, // { connId, socketId, name, avatar }
      pinnedVerse: null, // { verseKey, surahName, ayahNum, arabic, translation }
      raisedHands: new Map(), // connId -> { connId, socketId, name, avatar, ts }
      viewers: new Map(), // socketId -> { id, name }
      chat: [],
      nextSeat: 1,
    });
  }
  return rooms.get(roomId);
}

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.query?.token;
    if (!token) {
      // Allow anonymous connections but mark them as unauthenticated
      socket.data.user = null;
      socket.data.authenticated = false;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        email: true,
        full_name: true,
        role: true,
        is_scholar: true,
        avatar_url: true,
      },
    });

    if (!user) {
      socket.data.user = null;
      socket.data.authenticated = false;
      return next();
    }

    socket.data.user = user;
    socket.data.authenticated = true;
    socket.data.connId = socket.handshake.query?.connId || socket.id;
    next();
  } catch (err) {
    // Invalid/expired token — allow anonymous but unauthenticated
    socket.data.user = null;
    socket.data.authenticated = false;
    next();
  }
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authenticate socket connections via JWT token
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    let currentRoomId = null;
    let clientConnId = socket.data.connId || socket.id;
    const isAuthenticated = !!socket.data.authenticated;
    const socketUser = socket.data.user;

    // Broadcast updated global presence count to all clients
    io.emit('presence:global', { count: Math.max(1, io.engine.clientsCount) });

    // Join a live streaming room
    socket.on('join_room', ({ roomId, connId }) => {
      currentRoomId = roomId;
      if (connId) clientConnId = connId;

      socket.join(roomId);
      const room = getOrCreateRoom(roomId);

      // Send initial state to the client
      socket.emit('message', {
        type: 'room_state',
        hasBroadcaster: !!room.broadcasterId,
        viewerCount: room.viewers.size,
        activeSpeaker: room.activeSpeaker,
        pinnedVerse: room.pinnedVerse,
        handRaisedList: [...room.raisedHands.values()],
        chat: room.chat.slice(-50),
      });
    });

    // Scholar announcement: broadcast new live session to all connected clients.
    // Only authenticated scholars/admins may announce a broadcast.
    socket.on('scholar:start_broadcast', (sessionData) => {
      const canBroadcast = socketUser && (socketUser.is_scholar || socketUser.role === 'admin');
      if (!canBroadcast) {
        socket.emit('message', { type: 'error', message: 'ورود به سامانه الزامی است' });
        return;
      }
      socket.broadcast.emit('scholar:live_started', {
        ...sessionData,
        scholar_id: socketUser.id,
        scholar_name: sessionData?.scholar_name || socketUser.full_name,
      });
    });

    // Social notification: like or comment alert.
    // Requires authentication; the actor identity always comes from the socket
    // session, never from client-supplied data.
    socket.on('social:activity', (data) => {
      if (!socketUser) {
        socket.emit('message', { type: 'error', message: 'ورود به سامانه الزامی است' });
        return;
      }
      socket.broadcast.emit('social:notification', {
        ...(data && typeof data === 'object' ? data : {}),
        actor_id: socketUser.id,
        actor_name: socketUser.full_name || 'کاربر آیه',
      });
    });

    // Handle LiveRoom messages
    socket.on('message', (msg) => {
      if (!currentRoomId || typeof msg !== 'object' || msg === null) return;

      // Require authentication for privileged operations
      const requireAuth = () => {
        if (!isAuthenticated) {
          socket.emit('message', {
            type: 'error',
            message: 'ورود به سامانه الزامی است',
          });
          return false;
        }
        return true;
      };

      const room = getOrCreateRoom(currentRoomId);

      // Broadcaster claiming the stream (requires authentication)
      if (msg.type === 'claim_broadcaster') {
        if (!requireAuth()) return;
        if (!room.broadcasterId || room.broadcasterId === clientConnId) {
          room.broadcasterId = clientConnId;
          room.broadcasterSocketId = socket.id;
          io.to(currentRoomId).emit('message', { type: 'broadcaster_online' });
          socket.emit('message', { type: 'broadcaster_claimed' });
        } else {
          socket.emit('message', {
            type: 'error',
            message: 'بازپخش دیگری در حال انجام است',
          });
        }
      }

      // Viewer joining stream (anonymous allowed)
      if (msg.type === 'viewer_join') {
        if (room.viewers.size >= 50) {
          socket.emit('message', { type: 'error', message: 'اتاق پر است' });
          return;
        }

        room.viewers.set(clientConnId, {
          socketId: socket.id,
          seat: room.nextSeat++,
          name: String(msg.name || 'بیننده').slice(0, 50),
        });

        io.to(currentRoomId).emit('message', {
          type: 'presence',
          viewerCount: room.viewers.size,
        });

        if (room.broadcasterSocketId) {
          io.to(room.broadcasterSocketId).emit('message', {
            type: 'viewer_joined',
            viewerId: clientConnId,
          });
        }
      }

      // WebRTC signaling: offer
      if (msg.type === 'offer' && msg.target) {
        const targetViewer = room.viewers.get(msg.target);
        const targetSocketId = targetViewer ? targetViewer.socketId : (msg.target === room.broadcasterId ? room.broadcasterSocketId : null);
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', {
            type: 'offer',
            from: clientConnId,
            sdp: msg.sdp,
          });
        }
      }

      // WebRTC signaling: answer
      if (msg.type === 'answer' && msg.target) {
        const targetViewer = room.viewers.get(msg.target);
        const targetSocketId = targetViewer ? targetViewer.socketId : (msg.target === room.broadcasterId ? room.broadcasterSocketId : null);
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', {
            type: 'answer',
            from: clientConnId,
            sdp: msg.sdp,
          });
        }
      }

      // WebRTC signaling: ICE candidates
      if (msg.type === 'ice' && msg.target) {
        const targetViewer = room.viewers.get(msg.target);
        const targetSocketId = targetViewer ? targetViewer.socketId : (msg.target === room.broadcasterId ? room.broadcasterSocketId : null);
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', {
            type: 'ice',
            from: clientConnId,
            candidate: msg.candidate,
          });
        }
      }

      // Co-host: Hand Raise Request
      if (msg.type === 'raise_hand') {
        room.raisedHands.set(clientConnId, {
          connId: clientConnId,
          socketId: socket.id,
          name: String(msg.name || 'بیننده').slice(0, 50),
          avatar: String(msg.avatar || ''),
          ts: Date.now(),
        });
        io.to(currentRoomId).emit('message', {
          type: 'hand_raised_list',
          list: [...room.raisedHands.values()],
        });
      }

      // Co-host: Lower Hand / Cancel Request
      if (msg.type === 'lower_hand') {
        const targetId = msg.targetConnId || clientConnId;
        room.raisedHands.delete(targetId);
        io.to(currentRoomId).emit('message', {
          type: 'hand_raised_list',
          list: [...room.raisedHands.values()],
        });
      }

      // Co-host: Scholar accepts speaker
      if (msg.type === 'accept_speaker' && (room.broadcasterId === clientConnId || room.broadcasterSocketId === socket.id)) {
        const target = room.raisedHands.get(msg.targetConnId);
        if (target) {
          room.raisedHands.delete(msg.targetConnId);
          room.activeSpeaker = target;

          // Notify the accepted viewer
          io.to(target.socketId).emit('message', {
            type: 'speaker_accepted',
            connId: target.connId,
          });

          // Broadcast active speaker to the room
          io.to(currentRoomId).emit('message', {
            type: 'active_speaker_changed',
            speaker: target,
          });
          io.to(currentRoomId).emit('message', {
            type: 'hand_raised_list',
            list: [...room.raisedHands.values()],
          });
        }
      }

      // Co-host: Scholar dismisses/kicks speaker
      if (msg.type === 'kick_speaker' && (room.broadcasterId === clientConnId || room.broadcasterSocketId === socket.id)) {
        if (room.activeSpeaker) {
          const prev = room.activeSpeaker;
          room.activeSpeaker = null;
          io.to(prev.socketId).emit('message', { type: 'speaker_kicked' });
          io.to(currentRoomId).emit('message', {
            type: 'active_speaker_changed',
            speaker: null,
          });
        }
      }

      // Pinned Quran Verse for Live Stream
      if (msg.type === 'pin_verse' && (room.broadcasterId === clientConnId || room.broadcasterSocketId === socket.id)) {
        room.pinnedVerse = msg.verse;
        io.to(currentRoomId).emit('message', {
          type: 'pinned_verse_changed',
          verse: msg.verse,
        });
        if (msg.verse?.verseKey) {
          const sysMsg = {
            author: 'سامانه تدبّر',
            text: `آیه شریفه ${msg.verse.verseKey} توسط استاد به عنوان محور گفتگو پین شد.`,
            system: true,
            ts: Date.now(),
          };
          room.chat.push(sysMsg);
          if (room.chat.length > 200) room.chat.shift();
          io.to(currentRoomId).emit('message', { type: 'chat', message: sysMsg });
        }
      }

      if (msg.type === 'unpin_verse' && (room.broadcasterId === clientConnId || room.broadcasterSocketId === socket.id)) {
        room.pinnedVerse = null;
        io.to(currentRoomId).emit('message', {
          type: 'pinned_verse_changed',
          verse: null,
        });
      }

      // Chat messages
      if (msg.type === 'chat') {
        const entry = {
          author: String(msg.author || 'کاربر').slice(0, 50),
          text: String(msg.text || '').slice(0, 500),
          ts: Date.now(),
        };
        room.chat.push(entry);
        if (room.chat.length > 200) room.chat.shift();
        io.to(currentRoomId).emit('message', { type: 'chat', message: entry });
      }
    });

    // --- Khatm Sessions Realtime Handlers ---
    socket.on('khatm:join', ({ sessionId }) => {
      if (sessionId) {
        socket.join(`khatm_${sessionId}`);
      }
    });

    socket.on('khatm:leave', ({ sessionId }) => {
      if (sessionId) {
        socket.leave(`khatm_${sessionId}`);
      }
    });

    socket.on('khatm:salawat', async ({ sessionId, amount = 1 } = {}) => {
      if (!sessionId) return;
      if (!socketUser) {
        socket.emit('message', { type: 'error', message: 'ورود به سامانه الزامی است' });
        return;
      }
      // Clamp to a sane positive integer: never let a client decrement or
      // inflate the counter with a negative/huge amount.
      const increment = Math.min(100, Math.max(1, Math.floor(Number(amount) || 1)));
      try {
        const updated = await prisma.khatmSession.update({
          where: { id: String(sessionId) },
          data: { salawat_count: { increment } },
        });
        io.to(`khatm_${sessionId}`).emit('khatm:salawat_updated', {
          sessionId,
          salawat_count: updated.salawat_count,
        });
      } catch (e) {
        console.error('Khatm salawat increment error:', e.message);
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.broadcasterSocketId === socket.id || room.broadcasterId === clientConnId) {
        room.broadcasterId = null;
        room.broadcasterSocketId = null;
        io.to(currentRoomId).emit('message', { type: 'broadcaster_offline' });
      }

      if (room.raisedHands.has(clientConnId)) {
        room.raisedHands.delete(clientConnId);
        io.to(currentRoomId).emit('message', {
          type: 'hand_raised_list',
          list: [...room.raisedHands.values()],
        });
      }

      if (room.activeSpeaker?.connId === clientConnId) {
        room.activeSpeaker = null;
        io.to(currentRoomId).emit('message', {
          type: 'active_speaker_changed',
          speaker: null,
        });
      }

      if (room.viewers.has(clientConnId)) {
        room.viewers.delete(clientConnId);
        io.to(currentRoomId).emit('message', {
          type: 'presence',
          viewerCount: room.viewers.size,
        });
        if (room.broadcasterSocketId) {
          io.to(room.broadcasterSocketId).emit('message', {
            type: 'viewer_left',
            viewerId: clientConnId,
          });
        }
      }

      // Update global presence
      io.emit('presence:global', { count: Math.max(1, io.engine.clientsCount) });
    });
  });

  return io;
}
