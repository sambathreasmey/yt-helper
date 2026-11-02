# YouTube Helper

A Next.js static export for GitHub Pages, built with Tailwind CSS and reusable,
shadcn-style UI primitives.

## Run locally

```bash
npm ci
npm run dev
```

Paste a YouTube video URL or ID to play it. When opened without a video link,
the app opens YouTube after the delay set in **Helper Management**; interacting
with the page cancels the countdown. Set the delay to 0 to disable the automatic
redirect. The default delay is three seconds. Favorites and recent videos are
saved locally and use Telegram Cloud Storage when the app is opened as a
Telegram Mini App.

The **Gold trading** feature records gold purchases and sales in damlung, chi,
or hun (1 damlung = 10 chi = 100 hun), tracks portfolio value and realized /
unrealized profit or loss in USD, and supports Telegram transaction and target
price alerts. Gold data is stored by the Flask backend; Telegram Mini App
`initData` is verified server-side for user-scoped operations.
Buy and sell prices are entered in the selected quantity unit (for example,
USD per chi); the backend normalizes trade rates and the shared market price to
USD per damlung for consistent valuation.
The portfolio summary separates realized profit/loss from sales, unrealized
profit/loss on remaining gold, and the combined total. Purchase records show
their original investment, remaining cost and quantity, current value, and
total per-record profit/loss, and can be sorted by performance.
Use **Sell** on a purchase record to sell its remaining quantity. The sale
price is prefilled from the current market price, but can be changed to the
actual price received; the sale is attributed directly to that purchase lot.
The interface language can be selected as KH (Khmer), EN (English), or CN
(Chinese) from the appearance settings. Khmer is the default; the selection is
saved on the user's device.
Khmer text uses the Battambang font with a system Khmer fallback.

Before deploying the backend, apply
`helper_flask_app/sql/gold_trade_tables.sql` to the configured MySQL database.
Apply `helper_flask_app/sql/telegram_user_tables.sql` to create the global app
settings table used by YouTube auto-redirect, the optional YouTube-home
advertisement (banner title, message, image, and destination link), and other
global app controls. Reapply the script to expand the settings value column for
global settings JSON.
Reapply this idempotent schema script when deploying the force-delete feature
to create its deletion-reason audit table. Sold purchase records can then be
force-deleted from **Customize settings** by providing a reason and confirming
that linked sale history, reports, and summaries will change.
The shared price is read from `GET /api/gold/price`. The backend repository
includes a GitHub Actions workflow that fetches XAUUSD every 30 minutes and
updates the price through `POST /api/gold/price/github`. The endpoint accepts
`{"price_per_damlung": 5600}` and requires the `X-Gold-Update-Key` header.
Configure `GOLD_PRICE_UPDATE_API_KEY` in the backend environment and set a
matching GitHub Actions repository secret with that name. In **Helper
Management → Gold price feed**, enable
scheduled GitHub Action updates. When disabled, scheduled/manual workflow runs
skip changing the price. The Admin page displays the current price but no
longer has a manual price-entry form. The existing JWT-protected
`POST /api/gold/price` endpoint remains available to trusted integrations.
Telegram price alerts are sent when a price update crosses a user's target.
In **Helper Management**, administrators can also manage a YouTube-home ad,
app-wide announcement, maintenance notice, YouTube and Gold Trade availability,
support link, and default language. A user's saved language always overrides
the app default. Separate, confirmed Telegram actions send saved maintenance or
announcement messages to active users, or a private message to one selected
active user; saving a setting alone never sends a Telegram message. These
notifications use the backend's configured `telegram.polling_bot` token.

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
