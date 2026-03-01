# AutoBid — Vehicle Auction & Buy-Sell Platform

## Overview
A production-ready React Native (Expo + TypeScript) mobile application for vehicle auctions and buy-sell transactions.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), TypeScript, React Native
- **State**: React Query (TanStack Query), React Context (Auth)
- **UI**: @expo-google-fonts/urbanist, expo-linear-gradient, expo-image, expo-haptics
- **Auth**: expo-secure-store (JWT), custom AuthContext
- **Forms**: React Hook Form ready (currently plain state for simplicity)
- **Timers**: DayJS for countdown timers
- **State**: Zustand installed (available for expansion)
- **Backend**: Express.js on port 5000

## Folder Structure
```
app/
  _layout.tsx          # Root layout with providers (QueryClient, AuthProvider, GestureHandler)
  index.tsx            # Auth redirect screen
  (auth)/              # Auth flow: login → register → otp → pending
  (tabs)/              # Main app: index, live, buynow, deals, profile
contexts/
  AuthContext.tsx       # JWT auth state, login/logout
components/
  VehicleCard.tsx       # Reusable vehicle card (auction + buy now)
  CountdownTimer.tsx    # Live countdown timer component
  SubscriptionModal.tsx # Subscription plan selection modal
constants/
  colors.ts             # Dark automotive theme (orange #FF6B2C on dark navy #0D0D18)
utils/
  formatters.ts         # Currency (₹), date, countdown formatters
lib/
  auth.ts               # SecureStore JWT helpers + apiRequest with auth header
  query-client.ts       # TanStack Query client
server/
  routes.ts             # All mock API endpoints
```

## API Routes (Mock)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/verify-otp` — Verify OTP (demo: 1234)
- `GET /api/auth/status` — Poll approval status
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/user/home` — Home screen data (featured, categories, recent)
- `GET /api/user/live` — Live auctions
- `POST /api/user/live/:id/bid` — Place bid
- `GET /api/user/buy-now` — Buy now listings
- `POST /api/user/buy-now/:id/purchase` — Purchase vehicle
- `GET /api/user/deals` — My deals/transactions
- `GET /api/user/profile` — User profile + subscription
- `GET /api/subscriptions/me` — Subscription details
- `POST /api/subscriptions/purchase` — Buy subscription
- `POST /api/user/sell-request` — Submit vehicle for sale

## Auth Flow
1. Register → Phone + Email OTP (demo OTP: 1234) → Pending approval
2. Backend auto-accepts after OTP verified (for demo)
3. Login → JWT stored in SecureStore → Access main app

## Color Palette
- Background: #0D0D18 (dark navy)
- Primary: #FF6B2C (orange)
- Card: #16162A
- Text: #FFFFFF
- Secondary text: #9999BB

## Workflows
- `Start Backend`: Express server on port 5000 (`npm run server:dev`)
- `Start Frontend`: Expo dev server on port 8081 (`npm run expo:dev`)
