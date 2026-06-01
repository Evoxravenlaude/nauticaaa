# Nautica — Mobile QA Checklist

## What's been fixed in the codebase

| Fix | File | Status |
|-----|------|--------|
| `viewport-fit=cover` for notch devices | `index.html` | ✅ Applied |
| `env(safe-area-inset-bottom)` on BottomNav | `BottomNav.tsx` | ✅ Applied |
| `env(safe-area-inset-top)` on TopNav | `TopNav.tsx` | ✅ Applied |
| Min 44px touch targets on nav items | `BottomNav.tsx` | ✅ Applied |
| `appIcon` + `appUrl` for WalletConnect deep links | `web3.ts` | ✅ Applied |
| CSS safe-area variables in `:root` | `index.html` | ✅ Applied |

## Manual QA — run on real devices before launch

### iOS Safari (iPhone 14+ with Dynamic Island, iPhone SE for small screen)

- [ ] **Home page loads** without horizontal scroll
- [ ] **BottomNav** not obscured by home indicator bar
- [ ] **TopNav** not obscured by status bar / Dynamic Island
- [ ] **RainbowKit modal** opens and scrolls correctly (no background scroll)
- [ ] **WalletConnect QR code** displays correctly in modal
- [ ] **WalletConnect deep link** opens MetaMask/Rainbow app correctly
- [ ] **Send / Swap forms** — keyboard doesn't push content off-screen
- [ ] **Number inputs** show numeric keyboard (type="number" ✓)
- [ ] **Scroll position** resets on route change
- [ ] **Back navigation** (swipe gesture) works with React Router
- [ ] **Copy to clipboard** works (navigator.clipboard requires HTTPS ✓)
- [ ] **QR code** renders on Receive page
- [ ] **Dark mode** matches system preference on first load

### Android Chrome (Pixel 8 recommended)

- [ ] **Bottom navigation** above system gesture bar
- [ ] **Font rendering** correct (Space Grotesk + JetBrains Mono load)
- [ ] **WalletConnect** modal opens and pairing works
- [ ] **Transaction flow** (Send → Review → Confirm) works end to end
- [ ] **Swap flow** — quote debounce works on slower connections
- [ ] **NFT images** load (Alchemy CDN URLs work on mobile data)

### Performance (both platforms)

- [ ] **Initial load** under 3s on 4G (use Chrome DevTools Network throttle)
- [ ] **Lazy chunk loading** — navigating to DEX/NFT loads chunk in < 1s
- [ ] **No memory leak** — navigate 20+ pages, check DevTools memory
- [ ] **Images** — NFT grid loads with skeleton loaders visible before images

## Known mobile-specific issues to watch for

### WalletConnect on iOS Safari
WalletConnect uses `window.open()` for deep links. iOS Safari blocks popups
by default. If the wallet app doesn't open:
- The user needs to allow popups for the Nautica domain in Safari settings
- OR use RainbowKit's "Open in Wallet" button which handles this
- WalletConnect v2 (wagmi v2) handles this better than v1

### Keyboard + fixed positioning
When the keyboard opens on iOS, `position: fixed` elements can jump.
The TopNav and BottomNav have `position: fixed` — test all form inputs
(Send amount, Swap amount, NFT name) on iOS and verify the nav doesn't
overlap the active input.

**If this occurs:** add `translate3d(0, 0, 0)` to the fixed elements or
use `position: sticky` for the TopNav.

### CSS `backdrop-filter` on older Android
The `liquid-glass` and `liquid-glass-strong` classes use `backdrop-filter: blur()`.
This works on iOS Safari and Chrome 88+ but may fail on older Android WebView.
Add a fallback background-color in `tailwind.config.js` if needed.

### 100vh on mobile browsers
`min-h-screen` uses `100vh` which includes the browser chrome on mobile.
If content is cut off at the bottom, replace with:
```css
min-height: 100dvh; /* dynamic viewport height */
```
Add to `tailwind.config.js`:
```js
theme: { extend: { minHeight: { screen: '100dvh' } } }
```

## Lighthouse targets (run via Chrome DevTools → Lighthouse)

| Category | Target | Notes |
|----------|--------|-------|
| Performance | > 75 | Lazy loading + chunk splitting should help |
| Accessibility | > 90 | aria-labels + skip-nav + contrast fixes applied |
| Best Practices | > 90 | HTTPS + no console errors in prod |
| SEO | > 90 | OG tags + meta description ✓ |

## Run Lighthouse in CI (optional)

```bash
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```
