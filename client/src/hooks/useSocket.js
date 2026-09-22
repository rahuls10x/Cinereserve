import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useBookingStore } from '../store/useBookingStore';

export function useSocket(showId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const {
    updateSeatStatuses,
    addActivityLog,
    holdToken,
    clearHoldSession,
    setConflictAlert
  } = useBookingStore();

  useEffect(() => {
    // Connect to server (proxied by Vite or direct origin)
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to CineReserve Gateway with ID:', socket.id);
      if (showId) {
        socket.emit('join_show', { showId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    // Real-time Event: Seats Locked
    socket.on('SEATS_LOCKED', (data) => {
      console.log('[Socket Event] SEATS_LOCKED:', data);
      if (data.showId === showId) {
        updateSeatStatuses(data.seats, 'LOCKED', data.holdToken);
      }
    });

    // Real-time Event: Seats Released (Hold expired or cancelled)
    socket.on('SEATS_RELEASED', (data) => {
      console.log('[Socket Event] SEATS_RELEASED:', data);
      if (data.showId === showId) {
        updateSeatStatuses(data.seats, 'AVAILABLE', null);
      }
    });

    // Real-time Event: Seats Booked
    socket.on('SEATS_BOOKED', (data) => {
      console.log('[Socket Event] SEATS_BOOKED:', data);
      if (data.showId === showId) {
        updateSeatStatuses(data.seats, 'BOOKED', null);
      }
    });

    // Real-time Event: Activity Feed
    socket.on('ACTIVITY_LOG', (log) => {
      addActivityLog(log);
    });

    return () => {
      if (showId) {
        socket.emit('leave_show', { showId });
      }
      socket.disconnect();
    };
  }, [showId, updateSeatStatuses, addActivityLog]);

  return { socket: socketRef.current, isConnected };
}
