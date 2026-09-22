import { Server } from 'socket.io';

let ioInstance = null;

export function initSocket(server, clientOrigin = '*') {
  ioInstance = new Server(server, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join_show', (data) => {
      const showId = typeof data === 'string' ? data : data?.showId;
      if (showId) {
        const room = `show:${showId}`;
        socket.join(room);
        console.log(`[Socket] Client ${socket.id} joined room ${room}`);
      }
    });

    socket.on('leave_show', (data) => {
      const showId = typeof data === 'string' ? data : data?.showId;
      if (showId) {
        const room = `show:${showId}`;
        socket.leave(room);
        console.log(`[Socket] Client ${socket.id} left room ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

/**
 * Broadcast event when seats are locked
 */
export function broadcastSeatsLocked(showId, seats, holdToken) {
  if (!ioInstance) return;
  const room = `show:${showId}`;
  const payload = {
    showId,
    seats,
    holdToken,
    timestamp: new Date().toISOString()
  };
  ioInstance.to(room).emit('SEATS_LOCKED', payload);
  // Also emit to admin namespace/room
  ioInstance.emit('ACTIVITY_LOG', {
    timestamp: new Date().toLocaleTimeString(),
    message: `Redis: Acquired locks for ${seats.join(', ')} (TTL: 300s)`,
    type: 'LOCK'
  });
}

/**
 * Broadcast event when seats are released (cancelled or expired)
 */
export function broadcastSeatsReleased(showId, seats) {
  if (!ioInstance) return;
  const room = `show:${showId}`;
  const payload = {
    showId,
    seats,
    timestamp: new Date().toISOString()
  };
  ioInstance.to(room).emit('SEATS_RELEASED', payload);
  ioInstance.emit('ACTIVITY_LOG', {
    timestamp: new Date().toLocaleTimeString(),
    message: `Redis: Released locks for ${seats.join(', ')}`,
    type: 'RELEASE'
  });
}

/**
 * Broadcast event when seats are booked permanently
 */
export function broadcastSeatsBooked(showId, seats, bookingReference) {
  if (!ioInstance) return;
  const room = `show:${showId}`;
  const payload = {
    showId,
    seats,
    bookingReference,
    timestamp: new Date().toISOString()
  };
  ioInstance.to(room).emit('SEATS_BOOKED', payload);
  ioInstance.emit('ACTIVITY_LOG', {
    timestamp: new Date().toLocaleTimeString(),
    message: `Socket: Broadcasted SEATS_BOOKED for ${seats.join(', ')} [Ref: ${bookingReference}]`,
    type: 'BOOK'
  });
}
