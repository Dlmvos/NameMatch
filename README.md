# NameMatch 💕

> Tinder for baby names — swipe together, match together.

A React Native app for couples to collaboratively discover and match baby names. Both partners swipe independently; when you both love the same name, it's a match! 🎉

---

## Tech Stack

- **React Native** + **Expo** (~50) — iOS & Android
- **TypeScript** — full type safety
- **Supabase** — auth, database, real-time matching
- **Stripe** — payments (to be integrated)

---

## Project Structure

```
NameMatch/
├── App.tsx                    # Root component
├── app.json                   # Expo config
├── babel.config.js
├── package.json
├── tsconfig.json
├── .env.example               # Copy to .env and fill in values
├── src/
│   ├── theme.ts               # Colors, fonts, spacing, shadows
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces + constants
│   ├── data/
│   │   └── names.ts           # 350 sample names (50 per region)
│   ├── lib/
│   │   └── supabase.ts        # Supabase client
│   ├── context/
│   │   ├── AuthContext.tsx    # Auth state + actions
│   │   └── AppContext.tsx     # Room, swipes, matches state
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Stack + Tab navigation
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── AuthScreen.tsx     # Login + Signup
│   │   ├── PreferencesScreen.tsx  # Gender preference
│   │   ├── RegionScreen.tsx   # Region selection
│   │   ├── PartnerConnectScreen.tsx
│   │   ├── SwipeScreen.tsx    # Main swiping UI
│   │   ├── MatchesScreen.tsx  # All mutual matches
│   │   ├── ShopScreen.tsx     # Name pack purchases
│   │   └── SettingsScreen.tsx
│   └── components/
│       ├── SwipeCard.tsx      # Swipeable name card
│       └── MatchCelebration.tsx  # Match confetti modal
└── supabase/
    ├── schema.sql             # Full DB schema with RLS + functions
    └── seed.sql               # Sample data for testing
```

---

## Getting Started

### 1. Install dependencies

```bash
cd NameMatch
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Optionally run `supabase/seed.sql` to add sample names
4. Go to **Project Settings → API** and copy your URL and anon key

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android.

---

## Key Features

### Freemium Model
- Each new user gets **100 free swipes**
- Free swipes work on names from the selected region
- After 100, users see the Shop to unlock more

### Name Categories
Names are organized by:
- **Region**: EU, US, ARABIA, MENA, ASIA, LATIN_AMERICA, WORLDWIDE
- **Country**: specific country within each region
- **Gender**: boy, girl, neutral

### Real-time Matching
- Uses Supabase Realtime to detect when both partners swipe right
- `check_and_create_match()` SQL function handles match creation atomically
- Instant push notification via WebSocket subscription

### Partner Rooms
- User 1 creates a room → gets a 6-letter code
- User 2 enters the code → both are now linked
- Swipes are scoped to the room

---

## Stripe Integration (Next Step)

The Shop screen is built and ready. To add payments:

1. Install Stripe SDK:
   ```bash
   npx expo install @stripe/stripe-react-native
   ```

2. Add to `.env`:
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Create a Supabase Edge Function for payment intent creation
4. Wrap `App.tsx` with `<StripeProvider>`
5. In `ShopScreen.tsx`, replace the `Alert` in `handlePurchase` with the actual Stripe flow

---

## Supabase Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with preferences, room, free swipes |
| `rooms` | Couples connect via 6-letter code |
| `baby_names` | Name library (name, meaning, origin, region, gender) |
| `swipes` | Each user's left/right swipes per room |
| `matches` | Mutual right-swipes — created by `check_and_create_match()` |
| `purchases` | Stripe payment records |

RLS (Row Level Security) is enabled on all tables. Users can only see their own data.

---

## Design System

Colors are in `src/theme.ts`. The palette is warm and playful:

- **Background**: `#FFF9F5` — warm cream
- **Primary**: `#FF6B9D` — soft rose pink
- **Like**: `#4CAF50` — green ✅
- **Skip**: `#FF5252` — red ✗
- **Match**: `#A8E6CF` — mint green

---

## Roadmap

- [ ] Stripe payment integration
- [ ] Push notifications (Expo Notifications)
- [ ] Name sharing / export to PDF
- [ ] Advanced filtering (length, starting letter, pronunciation)
- [ ] Name popularity data
- [ ] Animated confetti upgrades
- [ ] Apple Sign-In / Google Sign-In

---

*Made with 💕 for expecting parents*
