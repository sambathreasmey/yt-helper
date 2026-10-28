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
- `hooks/` contains stateful React integrations for Telegram, storage, and playback.
- `services/` contains YouTube, Telegram, and library-storage adapters. Add future
  API clients here so components do not depend on transport details.
