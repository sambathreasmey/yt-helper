# YouTube Helper

A Next.js static export for GitHub Pages, built with Tailwind CSS and reusable,
shadcn-style UI primitives.

## Run locally

```bash
npm ci
npm run dev
```

Paste a YouTube video URL or ID to play it. When opened without a video link,
the app opens YouTube after three seconds; interacting with the page cancels
the countdown. Favorites and recent videos are saved locally and use Telegram
Cloud Storage when the app is opened as a Telegram Mini App.

The **Gold trading** feature records gold purchases and sales in damlung, chi,
or hun (1 damlung = 10 chi = 100 hun), tracks portfolio value and realized /
unrealized profit or loss in USD, and supports Telegram transaction and target
price alerts. Gold data is stored by the Flask backend; Telegram Mini App
`initData` is verified server-side for user-scoped operations.
The portfolio summary shows one combined profit/loss figure (realized sales
plus unrealized value of remaining gold). Purchase records show their original
investment, remaining cost and quantity, current value, and total per-record
profit/loss, and can be sorted by performance.
The interface language can be selected as KH (Khmer), EN (English), or CN
(Chinese) from the top language selector or the appearance settings. Khmer is
the default; the selection is saved on the user's device.
Khmer text uses the Battambang font with a system Khmer fallback.

Before deploying the backend, apply
`helper_flask_app/sql/gold_trade_tables.sql` to the configured MySQL database.
The shared price is read from `GET /api/gold/price`
and can be updated by an administrator with a JWT via `POST /api/gold/price`
using `{"price_per_damlung": 2400, "source": "manual"}`. Partner price
integrations can use the same endpoint with a source label. Price alert
messages are sent when a subsequent price update crosses a user's target.
The existing `/admin` page also provides an administrator-only manual price form.

Use **Customize** in the header to select System, Light, or Dark, pick from six
accent colors, choose the app icon and one of 12 backgrounds, adjust Glass card
blur from 0–100%, change card surfaces and corner shapes, select an animation
style, and choose Classic, Compact, Dashboard, or Gallery layout. Preferences
are saved locally. System follows Telegram's theme in the Mini App and the
operating system preference in a regular browser. Blur is available when Glass
cards are selected; background effects respect the animation and reduced-motion
preferences. Several decorative backgrounds use lightweight inline SVG patterns.
The YouTube countdown includes a per-second animated indicator and progress
shimmer.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the site when
you push to `main` or run it manually. In repository settings, select
**Pages → Build and deployment → Source → GitHub Actions**.

The workflow sets the base path for project repositories and deploys
user/organization Pages repositories at the root path.

## Project structure

- `app/` contains the Next.js route, layout, and Tailwind entry point.
- `components/ui/` contains reusable buttons, cards, badges, and inputs.
- `components/` contains shared page-level UI.
- `features/youtube-helper/` composes the YouTube Helper feature.
- `features/gold-trading/` manages user purchases, sales, reports, and price alerts.
- `hooks/` contains stateful React integrations for Telegram, storage, and playback.
- `services/` contains YouTube, Telegram, and library-storage adapters. Add future
  API clients here so components do not depend on transport details.
