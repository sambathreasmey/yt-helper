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

Use the theme picker in the header to choose System, Light, or Dark. The choice
is saved in local storage; System follows Telegram's theme in the Mini App and
the operating system preference in a regular browser.

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
