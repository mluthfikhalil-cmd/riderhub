# RiderHub - Development Roadmap

## 📅 Overview Timeline: 8 Minggu

```
Week 1-2  │  Week 3-4  │  Week 5-6  │  Week 7-8
──────────┼───────────┼───────────┼───────────
Setup     │  Parts    │  Community│  Personalize
Auth      │  Market-  │  Forums   │  Launch
Home      │  place    │  Chat     │  v1.0
Events    │  Search   │  Posts    │
```

---

## 🎯 Week 1-2: Foundation & Core Screens

### Goals:
- [x] Expo setup + dependencies ✅
- [x] Theme system (Dark Mode) ✅
- [x] Navigation setup ✅
- [x] 5 basic screens ✅
- [ ] Supabase integration
- [ ] User authentication (Login/Register)
- [ ] User profile with auth state

### Screens:
- Home Screen → with real data
- Events Screen → with filters
- Parts Screen → basic layout
- Community Screen → basic layout
- Profile Screen → with auth

### Tech:
- Supabase Auth
- React Context for auth state
- AsyncStorage for local data

---

## 🔧 Week 3-4: Spareparts Marketplace

### Goals:
- [ ] Parts catalog with real categories
- [ ] Search functionality
- [ ] Product detail screen
- [ ] Seller profiles
- [ ] Wishlist feature
- [ ] Price comparison
- [ ] Cart system

### Screens:
- Parts Home (catalog view)
- Product Detail
- Seller Profile
- Search Results
- Wishlist
- Cart

### Tech:
- Supabase Database
- Product images (Supabase Storage)
- Full-text search

---

## 💬 Week 5-6: Community Features

### Goals:
- [ ] Community listing
- [ ] Post creation & feed
- [ ] Comments & likes
- [ ] Community chat/groups
- [ ] User mentions
- [ ] Ride scheduling
- [ ] Event integration

### Screens:
- Communities List
- Community Detail
- Post Detail
- Create Post
- Chat/Group
- Ride Schedule

### Tech:
- Real-time chat (Supabase Realtime)
- Push notifications
- Image/video upload

---

## ✨ Week 7-8: Personalization & Launch

### Goals:
- [ ] Motor profile setup
- [ ] Personal feed algorithm
- [ ] SPBU Finder integration
- [ ] Fuel Tracker
- [ ] Service Cost Calculator
- [ ] Second Hand Value estimator
- [ ] Battery Health monitor
- [ ] Motor Diagnostic AI
- [ ] Route History
- [ ] Bug fixes & polish
- [ ] App Store submission

### Screens:
- Motor Setup Wizard
- SPBU Finder
- Fuel Tracker
- Service Calculator
- Value Estimator
- Diagnostic AI
- Route History
- Settings

### Tech:
- Google Maps API
- Push notifications
- Analytics
- Crash reporting

---

## 📊 Revenue Features (Future)

| Feature | Revenue Model |
|---------|--------------|
| Spareparts commission | 5-10% per sale |
| Featured sellers | Rp 500K/month |
| Premium membership | Rp 25K/month |
| In-app ads | CPM based |
| Event ticketing | 10% commission |

---

## 🐛 Known Issues / TODO

- [ ] TypeScript strict mode fixes
- [ ] Safe area handling for notches
- [ ] Pull to refresh
- [ ] Loading states
- [ ] Error handling
- [ ] Dark/Light mode toggle
- [ ] Offline support

---

## 📁 Key Files Reference

| File | Description |
|------|-------------|
| `src/theme/index.ts` | Design system |
| `src/components/index.tsx` | Reusable components |
| `src/navigation/AppNavigator.tsx` | Tab navigation |
| `src/screens/*.tsx` | 5 main screens |
| `App.tsx` | Entry point |

---

## 🚀 Quick Start Commands

```bash
cd C:\Users\mluth\RiderHub

# Development
npx expo start

# Build for Android
eas build -p android --local

# Build for iOS
eas build -p ios --local
```

---

_Last updated: 2026-04-24_
_Progress: Foundation complete (Week 1-2 in progress)_