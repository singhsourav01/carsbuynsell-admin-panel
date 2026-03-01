# AutoBid — Cars Buy and Sell Platform

## Overview
A production-ready React Native (Expo + TypeScript) mobile application for vehicle auctions and buy-sell transactions.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), TypeScript, React Native
- **State**: React Query (TanStack Query), React Context (Auth)
- **UI**: @expo-google-fonts/urbanist, expo-linear-gradient, expo-image, expo-haptics
- **Auth**: expo-secure-store (JWT), custom AuthContext
- **Timers**: DayJS for countdown timers
- **State**: Zustand installed (available for expansion)
- **Backend**: Express.js on port 5000

## Theme / Design
- Light gray-blue background: #EEF2F8
- White cards with subtle borders (#E8ECF4)
- Dark navy logo: #1C2B4A
- Primary blue: #3D5BD9
- Action button (gray-blue): #607991
- Font: Urbanist (400, 500, 600, 700)
- Matches design screenshots: phone OTP login, blue hero home

## Folder Structure
```
app/
  _layout.tsx              # Root layout with providers
  index.tsx                # Auth redirect
  (auth)/
    login.tsx              # Phone number + OTP login + Demo Login button
    otp.tsx                # 6-digit OTP screen (for login)
    register.tsx           # Signup form (name, phone, email, password)
    verify-phone.tsx       # Phone OTP verification (step 2 of signup)
    verify-email.tsx       # Email OTP verification (step 3 of signup)
    pending.tsx            # Pending admin approval screen
  (tabs)/
    _layout.tsx            # Tab layout (NativeTabs / classic Tabs)
    index.tsx              # Home: hero banner, quick actions, featured, recent
    live.tsx               # Live auctions with bid sheet
    buynow.tsx             # Buy now listings with detail modal
    deals.tsx              # My deals/transactions
    profile.tsx            # Profile, subscription, sell vehicle form
contexts/
  AuthContext.tsx           # JWT auth state, login/logout
components/
  CountdownTimer.tsx        # Live auction countdown
  SubscriptionModal.tsx     # Subscription plan selection
  ErrorBoundary.tsx         # App error boundary
constants/
  colors.ts                 # Light theme palette
utils/
  formatters.ts             # Currency (₹), date, countdown formatters
lib/
  auth.ts                   # SecureStore JWT helpers + apiRequest
  query-client.ts           # TanStack Query client
server/
  routes.ts                 # All API endpoints (mock in-memory data)
```

## Signup Flow (4 steps)
1. **Register** (`/register`) — name, phone, email, password → POST /api/auth/register
2. **Verify Phone** (`/verify-phone`) — 6-digit OTP, demo OTP: **123456** → POST /api/auth/verify-phone
3. **Verify Email** (`/verify-email`) — 6-digit OTP, demo OTP: **654321** → POST /api/auth/verify-email
4. **Pending** (`/pending`) — waits for admin approval, shows checklist

## Login Flow
- Enter phone → GET OTP → verify OTP (any 6 digits) → login
- "Try Demo Login" button → instant access as Demo User

## API Routes
- `POST /api/auth/register` — { fullName, phone, email, password } → { userId }
- `POST /api/auth/verify-phone` — { userId, otp: "123456" } → phone verified
- `POST /api/auth/verify-email` — { userId, otp: "654321" } → email verified, PENDING_APPROVAL
- `POST /api/auth/resend-otp` — { userId, type: "phone"|"email" }
- `POST /api/auth/request-otp` — { phone } → { userId } (login OTP)
- `POST /api/auth/verify-phone-otp` — { userId, otp } → { token, user }
- `POST /api/auth/demo-login` — instant demo access
- `GET /api/user/home` — featured, categories, recent listings
- `GET /api/user/live` — live auctions
- `POST /api/user/live/:id/bid` — place bid
- `GET /api/user/buy-now` — buy now vehicles
- `POST /api/user/buy-now/:id/purchase` — purchase
- `GET /api/user/deals` — my deals
- `GET /api/user/profile` — profile + subscription
- `GET /api/subscriptions/me` — subscription details
- `POST /api/subscriptions/purchase` — buy subscription
- `POST /api/user/sell-request` — submit vehicle for sale

## Demo Access
- "Try Demo Login" on login screen = instant access
- Pre-registered demo user: phone "+91 9999999999", status ACCEPTED

## Workflows
- `Start Backend`: Express server on port 5000 (`npm run server:dev`)
- `Start Frontend`: Expo dev server on port 8081 (`npm run expo:dev`)
