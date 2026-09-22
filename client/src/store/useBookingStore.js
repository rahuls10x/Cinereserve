import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  // Active Show & Layout Data
  currentShow: null,
  showLayout: null,
  isLoadingLayout: false,
  layoutError: null,

  // User Selection State (Max 6 seats)
  selectedSeats: [], // Array of { seatId, tier, price }

  // 5-Minute Hold Session State
  holdToken: null,
  expiresAt: null,
  ttlSeconds: 300,
  pricingBreakdown: null,

  // UI Modals & Drawers
  isCheckoutModalOpen: false,
  isConfirmationModalOpen: false,
  isAdminDrawerOpen: false,
  confirmedBooking: null,

  // Conflict / Notification State
  conflictAlert: null, // { message, conflictedSeats }

  // Admin / System Live Activity Feed
  liveActivityLogs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      message: 'System: CineReserve WebSocket & Distributed Lock engine initialized.',
      type: 'INFO'
    }
  ],

  // Actions
  setShow: (show) => set({ currentShow: show }),

  setLayout: (layout) => set({ showLayout: layout, isLoadingLayout: false }),
  setLoadingLayout: (isLoading) => set({ isLoadingLayout: isLoading }),
  setLayoutError: (error) => set({ layoutError: error, isLoadingLayout: false }),

  toggleSeatSelection: (seatId, tier, price) => {
    const { selectedSeats } = get();
    const existingIndex = selectedSeats.findIndex((s) => s.seatId === seatId);

    if (existingIndex > -1) {
      set({ selectedSeats: selectedSeats.filter((s) => s.seatId !== seatId) });
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 seats per booking.');
        return;
      }
      set({ selectedSeats: [...selectedSeats, { seatId, tier, price }] });
    }
  },

  clearSelection: () => set({ selectedSeats: [] }),

  setHoldSession: ({ holdToken, expiresAt, ttlSeconds, pricingBreakdown }) => {
    set({
      holdToken,
      expiresAt,
      ttlSeconds,
      pricingBreakdown,
      isCheckoutModalOpen: true,
      conflictAlert: null
    });
  },

  clearHoldSession: () => {
    set({
      holdToken: null,
      expiresAt: null,
      pricingBreakdown: null,
      isCheckoutModalOpen: false,
      selectedSeats: []
    });
  },

  setCheckoutModalOpen: (isOpen) => set({ isCheckoutModalOpen: isOpen }),
  setConfirmationModalOpen: (isOpen) => set({ isConfirmationModalOpen: isOpen }),
  setAdminDrawerOpen: (isOpen) => set({ isAdminDrawerOpen: isOpen }),
  toggleAdminDrawer: () => set((state) => ({ isAdminDrawerOpen: !state.isAdminDrawerOpen })),

  setConfirmedBooking: (booking) => {
    set({
      confirmedBooking: booking,
      isCheckoutModalOpen: false,
      isConfirmationModalOpen: true,
      holdToken: null,
      expiresAt: null,
      selectedSeats: []
    });
  },

  setConflictAlert: (alert) => set({ conflictAlert: alert }),
  clearConflictAlert: () => set({ conflictAlert: null }),

  addActivityLog: (log) => {
    set((state) => ({
      liveActivityLogs: [
        {
          timestamp: log.timestamp || new Date().toLocaleTimeString(),
          message: log.message,
          type: log.type || 'INFO'
        },
        ...state.liveActivityLogs.slice(0, 49) // Keep last 50 logs
      ]
    }));
  },

  // Update layout seat statuses reactively from Socket events
  updateSeatStatuses: (seats, newStatus, incomingHoldToken = null) => {
    const { showLayout, holdToken } = get();
    if (!showLayout || !showLayout.tiers) return;

    const seatSet = new Set(seats);
    const updatedTiers = showLayout.tiers.map((tier) => ({
      ...tier,
      rows: tier.rows.map((row) => ({
        ...row,
        seats: row.seats.map((seat) => {
          if (seatSet.has(seat.seatId)) {
            return {
              ...seat,
              status: newStatus,
              holdToken: incomingHoldToken
            };
          }
          return seat;
        })
      }))
    }));

    set({ showLayout: { ...showLayout, tiers: updatedTiers } });
  }
}));
