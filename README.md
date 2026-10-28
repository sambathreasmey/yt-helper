# YouTube Helper

This is a Next.js static export, ready to deploy to GitHub Pages.

## Run locally

```bash
npm ci
npm run dev
```

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the site when
you push to `main` or run it manually. In the repository settings, set
**Pages → Build and deployment → Source** to **GitHub Actions**.

The workflow sets the correct base path for project repositories and deploys
user/organization Pages repositories at the root path. Paste a YouTube video
link or video ID into the app to play it. When opened without a video link, the
app offers to open YouTube after a three-second countdown; tapping elsewhere
cancels it. Favorites and recent videos are saved locally, and Telegram profile
details and cloud storage are used when opened as a Telegram Mini App.
