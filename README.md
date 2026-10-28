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
user/organization Pages repositories at the root path. To enable in-app video
search, add a `NEXT_PUBLIC_YOUTUBE_API_KEY` repository Actions variable. This
key is included in client-side code, so restrict it to the YouTube Data API and
your deployed site in Google Cloud.
