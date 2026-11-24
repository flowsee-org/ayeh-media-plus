import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { authenticate } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac/permissions.js';
import { PERMISSIONS } from '../middleware/rbac/permissions.js';
import { rooms } from '../socket.js';

const router = Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

/**
 * GET /api/live/token
 * Query params:
 *   - room: string (required)
 *
 * Issues a LiveKit participant JWT.
 * - Scholars / Admins with LIVE_STREAM permission get publish privileges.
 * - Current active co-host (as registered in Socket.io room state) gets publish privileges.
 * - Viewers (authenticated or guest) get subscribe-only privileges.
 */
router.get('/token', authenticate({ required: false }), async (req, res) => {
  try {
    const roomId = req.query.room;
    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'room query parameter is required' });
    }

    const user = req.user;
    const roomState = rooms ? rooms.get(roomId) : null;

    // Determine participant identity & display name
    const participantIdentity = user ? user.id : `guest_${Math.random().toString(36).substring(2, 9)}`;
    const participantName = user?.full_name || (user ? 'کاربر آیه' : 'بیننده مهمان');

    // Determine publishing permissions
    const canBroadcasterPublish = user && hasPermission(user.role, PERMISSIONS.LIVE_STREAM);
    const isActiveSpeaker = roomState && roomState.activeSpeaker && roomState.activeSpeaker.connId === (req.query.connId || user?.id);

    const canPublish = Boolean(canBroadcasterPublish || isActiveSpeaker);

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: '4h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: canPublish,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return res.json({
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || 'ws://localhost:7880',
      identity: participantIdentity,
      canPublish,
    });
  } catch (err) {
    console.error('Error generating LiveKit token:', err);
    return res.status(500).json({ error: 'Failed to generate live token' });
  }
});

export default router;
