# Golf Charity Subscription Platform

An enterprise-grade SaaS application designed to connect golf enthusiasts with non-profit fundraising initiatives. Players subscribe to a monthly/yearly plan, choose their vetted charity, submit their latest golf scores, and automatically enter monthly prize pools.

---

## Technical Architecture

The platform uses a decoupled frontend and backend architecture:

### Frontend
- **Next.js 15** (App Router, dynamic page chunks)
- **TypeScript** for strict type safety
- **Tailwind CSS** for premium SaaS layouts and glassmorphism styling
- **Zustand** for client-side auth states
- **Lucide React** for modern UI icons

### Backend
- **Node.js** & **Express** server
- **Prisma ORM** connecting to PostgreSQL
- **Supabase Auth** (decodes JWT signatures locally, auto-syncing profiles)
- **Stripe SDK** ( checkout subscription sessions & billing webhooks)
- **Cloudinary SDK** + **Multer** (in-memory image buffer streams for scorecard claims)

---

## Folder Structure

```text
golf-charity-platform/
├── frontend/             # Next.js 15 Client
│   ├── app/              # App Router Pages
│   ├── components/       # Reusable UI Components
│   ├── lib/              # Client configs (supabase, api client)
│   ├── store/            # Zustand State
│   └── public/           # Static assets
│
├── backend/              # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/  # API route logic controllers
│   │   ├── routes/       # API router endpoints
│   │   ├── middleware/   # Auth token verification
│   │   ├── services/     # Prize pool & Draw logic engines
│   │   └── server.ts     # Express entry point
│   ├── prisma/
│   │   ├── schema.prisma # DB relationships models
│   │   └── seed.ts       # Database pre-population
│   └── package.json      # Dependencies
│
└── README.md             # This guide
```

---

## Detailed Business Logic

### 1. Golf Score Pruning System
- **Rules:** Golf scores are accepted only if they are integers between `1` and `45`.
- **Retention:** We only retain the user's latest 5 scores.
- **Cycle:** When a 6th score is submitted, the system automatically checks the user's score history, sorts by round date, and permanently deletes the oldest record, maintaining exactly 5 active numbers for monthly ticket generation.

### 2. Draw Engine Algorithms
Administrators can run, simulate, and publish draws. The engine calculates draw numbers (5 unique numbers between 1 and 45) using two modes:
- **Random Mode:** Standard random math generator.
- **Statistical Mode (Algorithmic):**
  - *MOST_FREQUENT:* Counts the statistical frequency of all scores submitted by players and selects the top 5 most frequently registered numbers.
  - *LEAST_FREQUENT:* Selects the bottom 5 least frequently registered numbers to create challenging draws.

### 3. Prize Pool Division & Rollover
- **Pool Allocation:** 50% of the active subscription revenue generated during the month is allocated to the players prize pool, and the other 50% is forwarded to user-selected charities.
- **Prize Categories:**
  - **5 Matches (Jackpot):** 40% of the players pool.
  - **4 Matches:** 35% of the players pool.
  - **3 Matches:** 25% of the players pool.
- **Rules:** The prize category pools are shared equally among all matching winners. If there are no 5-match jackpot winners, that 40% pool carries over (rolls over) directly into the next month's 5-match pool.

### 4. Stripe Subscription webhook syncs
- **Protected Access:** Users cannot manage scores or enter draws unless they have a subscription status of `ACTIVE`.
- **Stripe Webhooks:** The server listens to Stripe signatures. It processes:
  - `checkout.session.completed` (Creates active subscriber)
  - `invoice.payment_succeeded` (Renews active subscriber and sets new end date)
  - `customer.subscription.deleted` (Sets status to `EXPIRED`, locking dashboards)

---

## Local Development Setup

### 1. Database & Backend Configuration

1. Move to backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update connection keys (Supabase Auth and DB connection string).
4. Run migrations and compile the Prisma client:
   ```bash
   npx prisma migrate dev
   ```
5. Seed the default partner charities:
   ```bash
   npm run seed
   ```
6. Spin up the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration

1. Move to frontend folder:
   ```bash
   cd ../frontend
   ```
2. Create your `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
3. Update Supabase public variables and specify your backend address.
4. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
5. Visit the application at `http://localhost:3000`.

---

## Sandbox Bypass Mode
If Stripe keys or Cloudinary variables are not configured in your `.env` file:
- **Subscriptions:** Creating a checkout session automatically triggers sandbox bypass, creating an active subscription directly in your database for local feature testing.
- **Claims Proof:** Uploading a scorecard proof will automatically fall back to a mock secure url.
