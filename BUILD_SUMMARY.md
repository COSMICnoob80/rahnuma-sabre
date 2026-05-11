# RAHNUMA SABRE — Build Summary & Fresh Start Kit

## What It Is
React Native (Expo) offline-first Pakistani financial literacy app. 6 bottom tabs: Dashboard, Portfolio, Budget, Calculators, Advisory, Settings. SQLite persistence. OpenRouter-powered chat advisor.

## Stack
- `expo ~54.0.33`, `react-native 0.81.5`, `react 19.1.0`
- `expo-sqlite ~16.0.10`, `expo-secure-store ~15.0.8` (declared, never used)
- `@react-navigation/bottom-tabs ^7.15.13`
- Typescript ~5.9.2

## Commands
```bash
npm start          # Expo dev server
npm run android    # Launch on Android
npm run ios        # Launch on iOS
npm run ts:check   # TypeScript check (tsc --noEmit)
```

## File Map (12 source files)
```
App.tsx                              — Root: PinLock → AppNavigator
src/
  navigation/AppNavigator.tsx        — 6-tab bottom navigator
  database/db.ts                     — SQLite: holdings, expenses, income, settings tables
  types/index.ts                     — Holding, Expense, Income, Settings, PortfolioSummary, HoldingWithGain
  utils/calculators.ts               — CGT, SIP, DHA_ROI, Devaluation, FIRE, formatPKR
  screens/
    PinLockScreen.tsx                — 4-digit PIN create/verify
    DashboardScreen.tsx              — Net worth, savings rate, portfolio P&L, FIRE progress, quick links
    PortfolioScreen.tsx              — CRUD holdings, sector allocation bars, gain/loss per holding
    BudgetScreen.tsx                 — Income CRUD (cumulative, no date), Expense CRUD (monthly), category breakdown
    CalculatorsScreen.tsx            — 5 calculators: CGT, SIP, DHA ROI, PKR Devaluation, FIRE
    AdvisoryScreen.tsx               — Chat UI, OpenRouter API, key in inline TextInput (not persisted)
    SettingsScreen.tsx               — Cash, property, FIRE target, budget, PIN management
```

## Known Bugs (Fix Order)

| # | File | Bug | Fix |
|---|---|---|---|
| B1 | `DashboardScreen.tsx:113-121` | 3 Quick Link buttons have `onPress={undefined}` — do nothing | Import `useNavigation`, wire to Portfolio/Budget/Calculators tabs |
| B2 | `AdvisoryScreen.tsx:8` | `OPENROUTER_API_KEY = ''` hardcoded, key in React state lost on restart | Store via `expo-secure-store`, add input field in SettingsScreen, load on mount |
| B3 | `AdvisoryScreen.tsx:61-64` | Chat sends only `[system, single_user_msg]` — no conversation history | Map entire `messages[]` array to API payload (keep last 10) |
| B4 | `PortfolioScreen.tsx:139` | `current_price` always `null`, falls back to `avg_buy_price` (0 P&L) | Build PSX price fetcher service, call `updateHoldingPrice()` |
| B5 | `db.ts:30-33` | `income` table has NO `date` column — all income is cumulative forever | ALTER TABLE migration, add date to addIncome(), show monthly income |
| B6 | `CalculatorsScreen.tsx:102` | "DHA Plot ROI" label — too niche, misleads users | Rename to "Asset ROI Calculator", generic labels |
| B7 | `db.ts:178-186` | `simpleHash()` is non-cryptographic (acceptable for local PIN) | Low priority |
| B8 | No data export | All data lost on uninstall | JSON export via expo-file-system/expo-sharing |
| B9 | `SettingsScreen.tsx` | No API key field | Add "API Configuration" section with OpenRouter key + model selector |

## Schema Details (`db.ts`)

**holdings:** id, ticker, quantity, avg_buy_price, current_price (always null), last_fetched (always null)
**expenses:** id, amount, category, date
**income:** id, source, amount (NO date column — B5)
**settings:** key, value (used for cash, property, fire_target, monthly_budget, pin_hash)

## Next Build Priorities (Wave 1 — execute in this order)

### 1. API Key Persistence
- Create `src/utils/secureStorage.ts` — wrap `expo-secure-store` get/set
- Add "API Configuration" section to `SettingsScreen.tsx` — OpenRouter key + model selector
- `AdvisoryScreen.tsx`: remove inline API key bar, load from secure store on mount, show "No API key — go to Settings" empty state

### 2. Fix Quick Links (`DashboardScreen.tsx`)
- Import `useNavigation` from `@react-navigation/native`
- Add `onPress={() => navigation.navigate('Portfolio')}` etc.

### 3. Chat Conversation History (`AdvisoryScreen.tsx`)
- Send all prior messages in API call, not just latest
- Keep last 10 messages to limit tokens
- Inject portfolio/budget context as part of latest user message

### 4. DHA → Asset ROI (`CalculatorsScreen.tsx` + `calculators.ts`)
- Rename `calculateDHAROI` → `calculateAssetROI`, add backward-compat export
- Change labels: "Purchase Price", "Current/Future Value", "Years Held"
- Hint: "Works for property, gold, any appreciating asset"

### 5. Income Schema Migration (`db.ts` + `BudgetScreen.tsx` + `types/index.ts`)
- `ALTER TABLE income ADD COLUMN date TEXT` (with try/catch)
- Update `addIncome()` signature, add `getTotalIncomeByMonth(month)`
- BudgetScreen: show monthly income vs cumulative

### 6. PSX Live Prices (`src/services/psxService.ts`)
- Fetch from Yahoo Finance: `query1.finance.yahoo.com/v8/finance/chart/{TICKER}.KAR`
- Store via `updateHoldingPrice()`, only fetch if `last_fetched` > 15 min old
- "Refresh Prices" button in Portfolio, auto-refresh on app open
- Fallback to cached price if offline

### 7. Data Export (`src/services/dataService.ts` + `SettingsScreen.tsx`)
- JSON dump of all tables, share via expo-sharing
- Import/restore button

## Key Constraints
- Dark theme (#0a1628 bg, #1e293b cards, #3b82f6 accent)
- All responses prefixed: "Information only, not investment advice."
- Never say "buy" or "sell"
- Urdu/English mixed responses welcome
- Chat uses `deepseek/deepseek-v4-flash` model via OpenRouter

## Calculator Functions (`src/utils/calculators.ts`)
- `calculateCGT(buyPrice, sellPrice, quantity, holdingDays)` — Pakistan PSX holding-period tax brackets
- `calculateSIP(monthlyInvestment, annualReturn, years)` — FV with yearly breakdown
- `calculateDHAROI(buyPrice, currentValue, yearsHeld)` — CAGR formula, total return %
- `calculateDevaluation(currentPkrValue, devaluationPct)` — hardcoded USD/PKR=280
- `calculateFIRE(monthlyExpenses, currentSavings, monthlySavings, expectedReturn)` — 4% rule
- `formatPKR(amount)` — `Rs. X,XXX` format