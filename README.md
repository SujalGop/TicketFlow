# 🎟️ TicketFlow — High-Concurrency Event Ticketing Platform

> A production-ready, distributed event ticketing platform engineered to handle high-concurrency flash sales with zero race conditions, atomic payment fulfillment, and deterministic inventory reconciliation.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_ReplicaSet-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Webhook_Idempotent-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)

---

## 🔗 Live Deployment, Demo & Evaluator Credentials

* **Live Application (Frontend):** [https://ticket-flow-livid.vercel.app](https://ticket-flow-livid.vercel.app)
* **Backend API & Healthcheck:** [https://ticketflow-vd8x.onrender.com/api/health](https://ticketflow-vd8x.onrender.com/api/health)
* **Demo Video (3–5 mins):** [Watch Live System Walkthrough](https://drive.google.com/file/d/1_gQVzeQYEMCA44ptUHlMEtRS97_5v9pm/view?usp=sharing)

### 🔑 Evaluator Test Credentials (RBAC Quick Test)
Pre-seeded credentials are provided below so evaluators can test role-based authentication and workflows immediately without registering:

| Role | Email | Password | Allowed Workflows & Permissions |
| :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@test.com` | `password123` | Create events, set ticket capacities & pricing, monitor live sales & capacity metrics in the Organizer Dashboard |
| **Attendee** | `attendee@test.com` | `password123` | Search events, reserve time-locked seats, complete Razorpay checkout, view ticket wallet & QR passes |

---

## 📌 Executive Summary & Architecture

During high-demand flash sales (e.g., concert tours, sports championships), thousands of concurrent users attempt to purchase tickets within milliseconds. Naive database architectures suffer from **race conditions**, **double bookings**, **phantom inventory loss**, and **inconsistent payment states**.

**TicketFlow** solves these distributed systems challenges using the **MERN** stack combined with:
1. **Document-level atomic batch reservation** to support single and multi-ticket purchases without coarse-grained database locks.
2. **MongoDB ACID Multi-Document Transactions** to guarantee atomic order fulfillment.
3. **Cryptographically verified, idempotent webhooks** for asynchronous Razorpay settlement.
4. **Deterministic background inventory sweeper** to reclaim abandoned reservations without inventory leakage.

### 👥 Target Users & Core Workflows

* **Target User Groups:**
  1. **Event Organizers:** Event managers, promoters, and hosts who publish experiences and monitor ticketing analytics.
  2. **Attendees:** Event-goers and fans purchasing high-demand tickets in competitive flash sale conditions.

* **Core User Workflows & Features:**
  * **For Organizers:**
    * **Create & Publish Events:** Set event title, detailed description, future date/time, ticket pricing, and total venue capacity.
    * **Real-time Inventory Tracking:** View live capacity bars, available ticket counts, and total revenue generated per event.
    * **Role-Protected Organizer Dashboard:** Dedicated route (`/dashboard`) guarded by JWT role verification (`role: 'Organizer'`).
  * **For Attendees:**
    * **Discovery & Search:** Real-time search by title, location, or keywords with responsive glassmorphism event cards.
    * **Dedicated Event Details Page:** Rich event overview with interactive multi-ticket stepper (`-` / `+`), dynamic subtotal calculations, and capacity counters.
    * **Atomic Seat Locking (10-minute hold):** Locks tickets immediately to guarantee availability during payment processing without overselling.
    * **Seamless Razorpay Checkout:** Encrypted modal checkout supporting test cards, UPI, net banking, and instant webhooks.
    * **Attendee Ticket Wallet (`/tickets`):** View issued digital passes with QR verification and monitor temporary pending holds with live countdown timers.

```
                              ┌───────────────────────────────────────────────┐
                              │            React 19 SPA (Vite)                │
                              │  Tailwind CSS • Context API • Axios Interc.   │
                              └──────────────────────┬────────────────────────┘
                                                     │ HTTP / REST (JWT Auth)
                                                     ▼
                              ┌───────────────────────────────────────────────┐
                              │              Express.js API Gateway           │
                              │   Rate Limiting • Role-Based Access Control   │
                              └───────┬───────────────────────────────┬───────┘
                                      │                               │
            ┌─────────────────────────┴─────────┐         ┌───────────┴───────────┐
            │   Atomic Inventory Lock ($inc)    │         │ Background Cron Sweeper│
            │  MongoDB Multi-Document Session   │         │ (node-cron / 1-min)   │
            └─────────────────┬─────────────────┘         └───────────┬───────────┘
                              │                                       │
                              ▼                                       ▼
    ┌───────────────────────────────────────────────┐   ┌───────────────────────────────┐
    │          MongoDB Atlas Replica Set            │   │      Razorpay Gateway         │
    │  Events • Reservations • Tickets • Users      │   │ Webhook Event (HMAC SHA-256)  │
    └───────────────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 🚀 Key Technical Deep Dives (Engineering Highlights)

### 1. Zero-Race-Condition Multi-Ticket Reservation (Atomic Locking)
* **The Problem:** In standard `SELECT` then `UPDATE` patterns, two parallel requests can check `availableTickets >= qty`, pass validation, and both decrement inventory—selling more tickets than available (overselling).
* **The Solution:** TicketFlow utilizes atomic MongoDB update queries (`$inc: { availableTickets: -qty }`) bounded by a strict query-level predicate (`availableTickets: { $gte: qty }`).
* **Implementation:**
  ```javascript
  // server/controllers/ticketController.js
  const event = await Event.findOneAndUpdate(
    { _id: eventId, availableTickets: { $gte: qty } },
    { $inc: { availableTickets: -qty } },
    { new: true, session }
  );

  if (!event) {
    return res.status(400).json({ success: false, message: 'Not enough tickets available' });
  }
  ```
  Because MongoDB writes on single documents are serialized at the storage engine layer (WiredTiger), race conditions are mathematically impossible without incurring the high latency of distributed Redis redlocks or table-level locking.

---

### 2. Atomic Order Fulfillment via Mongoose Multi-Document Transactions
* **The Problem:** When converting a temporary reservation into a permanent ticket, several database operations must occur:
  1. Validating the temporary reservation is still `Pending`.
  2. Marking the reservation `Completed`.
  3. Creating a new permanent `Ticket` record.
  If the server crashes between steps 2 and 3, money is collected but no ticket is created (data corruption).
* **The Solution:** All state transitions execute inside a **MongoDB ACID Replica Set Transaction** (`session.withTransaction()`).
* **Implementation:**
  ```javascript
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOneAndUpdate(
        { _id: reservationId, status: 'Pending' },
        { status: 'Completed' },
        { session, new: true }
      );
      if (!reservation) throw new Error('Reservation expired or invalid');

      await Ticket.create([
        {
          eventId: reservation.eventId,
          userId: reservation.userId,
          quantity: reservation.quantity || 1,
          razorpayOrderId,
          paymentStatus: 'Paid'
        }
      ], { session });
    });
  } finally {
    session.endSession();
  }
  ```
  If any step throws an error, the transaction automatically rolls back—guaranteeing 100% database consistency.

---

### 3. Razorpay Webhook Cryptographic Verification & Idempotency
* **The Problem:** Payment gateways deliver asynchronous webhooks over the public internet. Attacks can include forged payload requests or duplicate network deliveries (at-least-once delivery).
* **The Solution:**
  1. **HMAC-SHA256 Signature Verification:** Incoming webhook bodies are captured as raw binary buffers (`req.rawBody`) before JSON parsing to preserve exact byte sequence, and compared using `crypto.createHmac()`.
  2. **Idempotency Guard:** Every incoming webhook payload checks if a ticket with the given `razorpayOrderId` has already been provisioned before initiating database updates. Duplicate events are acknowledged (`200 OK`) and discarded safely.
* **Implementation:**
  ```javascript
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (expectedSignature !== req.headers['x-razorpay-signature']) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }
  ```

---

### 4. Background Inventory Sweeper (Fixing the "TTL Ticket Leak")
* **The Problem:** Native MongoDB TTL (Time-To-Live) indexes delete documents after a timestamp. However, when MongoDB silently deletes an expired pending `Reservation`, it **never** notifies the `Event` model to increment `availableTickets` back. Tickets are permanently leaked and lost from inventory.
* **The Solution:** Replaced native TTL index deletion with an active, deterministic background worker powered by `node-cron` (`server/workers/inventoryWorker.js`).
* **Workflow:**
  1. Runs every 60 seconds (`* * * * *`).
  2. Queries all `Reservation` documents with `status: 'Pending'` where `createdAt <= Date.now() - 10 minutes`.
  3. For each expired item, executes an isolated Mongoose transaction:
     - Sets `reservation.status = 'Expired'`.
     - Atomically increments `Event.availableTickets` by `res.quantity` (supporting multi-ticket releases).
  4. Uses `Promise.allSettled()` to process expired batches without individual item failures blocking the sweeper pipeline.

---

## 🛠️ Tech Stack & Directory Structure

```
├── server/
│   ├── config/              # MongoDB connection & pool settings
│   ├── controllers/         # Auth, Event, Ticket, Payment, and Admin controllers
│   ├── middlewares/         # JWT verification, Role-based guards, Centralized error handler
│   ├── models/              # User, Event, Reservation, Ticket Mongoose schemas
│   ├── routes/              # Express REST API routes
│   ├── utils/               # Async error wrappers & helper methods
│   ├── workers/             # inventoryWorker.js (Active background reservation sweeper)
│   ├── seed.js              # Database seed script (evaluator accounts & demo events)
│   ├── server.js            # Server entry point with CORS & webhook rawBody buffer
│   ├── Procfile             # Deployment command for long-running PaaS
│   └── .env.example         # Production & development environment template
│
├── ticketflow-client/
│   ├── src/
│   │   ├── api/axios.js     # Centralized Axios with Bearer token injection & 401 interceptor
│   │   ├── context/         # AuthContext.jsx (Global session state & profile fetch)
│   │   ├── hooks/           # useCheckout.js (Multi-step atomic Razorpay pipeline hook)
│   │   ├── components/      # Navbar, ProtectedRoute (RBAC), Checkout trigger
│   │   ├── pages/           # Home, EventDetails, MyTickets (Wallet), OrganizerDashboard, Login, Register
│   │   ├── index.css        # Tailwind CSS design system tokens & glassmorphism utilities
│   │   └── App.jsx          # Declarative React Router setup with role guards
│   ├── vercel.json          # SPA routing configuration for Vercel
│   ├── vite.config.js       # Vite bundler & proxy configuration
│   └── package.json
│
├── tests/
│   └── loadTest.js          # Standalone concurrency race-condition simulation script
│
├── .gitignore               # Multi-tier ignore rules (protects credentials & logs)
└── render.yaml              # Render Cloud infrastructure-as-code blueprint
```

---

## ⚙️ Environment Variables Matrix

### Backend (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Listening server port | `5000` |
| `NODE_ENV` | Application environment mode | `production` / `development` |
| `MONGO_URI` | MongoDB Atlas URI (Replica Set required for transactions) | `mongodb+srv://user:pass@cluster.mongodb.net/ticketflow` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `min_32_chars_random_secret` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `RAZORPAY_KEY_ID` | Razorpay public key identifier | `rzp_test_xxxx` / `rzp_live_xxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay private secret key | `your_secret_key` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured on Razorpay Webhook Dashboard | `your_webhook_secret` |
| `CLIENT_URL` | Allowed frontend origin for strict CORS | `https://ticketflow.vercel.app` |

### Frontend (`ticketflow-client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API base URL | `https://api.yourdomain.com/api` (or `/api` with proxy) |

---

## 💻 Local Setup & Installation

### Prerequisites
* **Node.js**: v18.x or later
* **npm**: v9.x or later
* **MongoDB**: A running MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (Atlas is recommended as it natively supports multi-document transactions out of the box).

### 1. Clone Repository
```bash
git clone https://github.com/SujalGop/TicketFlow.git
cd TicketFlow
```

### 2. Configure & Run Backend Server
```bash
cd server
npm install

# Copy environment variables and configure them
cp .env.example .env

# Seed database with initial evaluator accounts and demo events
node seed.js

# Run in development mode with nodemon
npm run dev
```
*The server will start on `http://localhost:5000` and automatically initiate the inventory sweeper cron job.*

### 3. Configure & Run Frontend Client
In a separate terminal window:
```bash
cd ticketflow-client
npm install

# Start Vite development server
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 📡 REST API Reference & Postman Testing

All protected endpoints require the header:
`Authorization: Bearer <your_jwt_token>`

### Authentication
* `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, `role: ['Attendee' | 'Organizer']`)
* `POST /api/auth/login` — Sign in and receive JWT token
* `GET /api/auth/me` — Retrieve authenticated user profile *(Protected)*

### Events
* `GET /api/events` — Retrieve all upcoming events with available inventory *(Public)*
* `GET /api/events/:id` — Get single event details *(Public)*
* `GET /api/events/my-events` — Get events created by logged-in organizer *(Organizer only)*
* `POST /api/events` — Create new event (`title`, `description`, `date`, `price`, `totalCapacity`) *(Organizer only)*

### Tickets & Reservation Pipeline
* `POST /api/tickets/reserve` — Atomic inventory decrement with 10-minute hold (`eventId`, `quantity`) *(Protected)*
* `POST /api/payments/create-order` — Create Razorpay order from reservation (`reservationId`) *(Protected)*
* `POST /api/webhooks/razorpay` — Asynchronous webhook handler for payment settlement *(Signature Verified)*
* `GET /api/users/tickets` — View all confirmed tickets for logged-in user *(Protected)*
* `GET /api/users/reservations` — View all reservation holds and their statuses *(Protected)*

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `ticketflow-client`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variable:
   * `VITE_API_URL` = `https://ticketflow-vd8x.onrender.com/api`
5. Deploy. The included `vercel.json` ensures that direct links and route reloads resolve correctly through `index.html`.

### Backend Deployment (Render / Railway / Fly.io)
> ⚠️ **Important:** Do not deploy the backend to serverless platforms (e.g., Vercel Functions, AWS Lambda). The background reservation sweeper (`node-cron`) requires an active, long-running persistent Node.js process.

1. Connect repository to [Render](https://render.com).
2. Use **Root Directory** `server`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all required production environment variables (`MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CLIENT_URL`).
6. Configure the Razorpay Webhook on Razorpay Dashboard:
   * **Webhook URL:** `https://ticketflow-vd8x.onrender.com/api/webhooks/razorpay`
   * **Active Events:** `payment.captured`, `order.paid`
   * **Secret:** Matches `RAZORPAY_WEBHOOK_SECRET`

---

## 📜 License
This project is licensed under the [ISC License](LICENSE).
