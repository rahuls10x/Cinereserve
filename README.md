# CineReserve 🎬

> **Distributed High-Concurrency Cinema Booking Platform**  
> Built with **React 18 + Vite + Tailwind CSS**, **Node.js / Express**, **MongoDB Atlas (Mongoose)**, **Redis 7+ (Lua Scripts)**, and **Socket.io**.

---

## 🌟 Key Engineering Features

- **Distributed In-Memory Seat Locking:** Prevents double bookings under high-concurrency race conditions using atomic Redis Lua scripts.
- **Deterministic 5-Minute (300s) Hold Window:** Live countdown clock with automatic rollback via Redis keyspace expiration events and backend sweepers.
- **Real-Time WebSocket Synchronization:** Instant state propagation (`AVAILABLE` ↔ `LOCKED` ↔ `BOOKED`) to all connected showroom clients without page refreshes.
- **Mock Payment Engine Playground:** Dual-mode simulation (`Instant Success` committing MongoDB transactions, `Simulate Failure` rolling back locks).
- **Collapsible Live Admin Monitor:** Real-time metrics drawer displaying live occupancy ratios, gross revenue, tier distribution, and streaming activity logs.
- **Ultra-Modern Dark Aesthetics:** Obsidian pitch black (`#0B0F17`), Electric Indigo (`#6366F1`), Neon Cyan (`#06B6D4`), glassmorphism, and tiered seat geometry (Recliner, Prime, Classic).

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------+
|                                React SPA Client                                 |
|               (Seat Map Canvas / 300s Countdown / Mock Checkout)               |
+---------------------------------------------------------------------------------+
           | (HTTP REST)                                    ^ (WSS / Socket.io)
           v                                                |
+---------------------------------------------------------------------------------+
|                        Express.js Application Server                            |
|                                                                                 |
|  [REST Controllers]         [Concurrency Engine]       [WebSocket Gateway]     |
|   - Catalog & Showtimes      - Atomic Lua Runner        - Show Rooms Manager    |
|   - Lock Reservation         - Token Validator          - State Broadcasts      |
|   - Mock Payment Checkout    - Expire Sweeper           - Socket.io Adapter     |
+---------------------------------------------------------------------------------+
           |                                  |
           v (Mongoose Driver)                v (ioredis / Redis Engine)
+------------------------+        +-----------------------------------------------+
|     MongoDB Atlas      |        |                 Redis 7+                      |
|  - movies              |        |  - Seat Locks: lock:show:{id}:{seatId}        |
|  - theaters & screens  |        |  - Active Holds: hold:{token}:metadata        |
|  - shows (bookedSeats) |        |  - Keyspace Pub/Sub: __keyevent@0__:expired   |
|  - bookings (audit)    |        +-----------------------------------------------+
+------------------------+
```

---

## 🚀 Quick Start & Running Locally

### 1. Start the Backend API Server
```bash
cd server
npm run dev
```
The server will start at `http://localhost:5000`. If external MongoDB or Redis are not configured in `.env`, it automatically boots integrated high-performance in-memory engines with zero setup required.

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
The client will start at `http://localhost:5173`.

---

## 🧪 Testing Concurrency & Race Conditions

1. Open `http://localhost:5173` in **Tab A** and select a movie (e.g. *Oppenheimer*).
2. Open the exact same URL in **Tab B** (or Incognito window).
3. In **Tab A**, select seats `A3` & `A4` and click **"Lock Seats & Pay"**.
4. Observe **Tab B**: Seats `A3` & `A4` instantly turn amber (`On Hold`) with a live clock badge without refreshing!
5. In **Tab B**, try to click `A3`: It is blocked with mutual exclusion.
6. In **Tab A**, click **"Simulate Instant Success"**:
   - Tab A displays the digital boarding-pass confirmation with turnstile QR code.
   - Tab B instantly marks `A3` and `A4` as permanently solid dark grey (`Sold / Booked`).
7. In the top navbar, open the **Admin Monitor** to inspect occupancy percentage and streaming activity logs in real-time.
