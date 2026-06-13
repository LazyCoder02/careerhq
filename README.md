# CareerHQ

A personal job-tracking, résumé and project-management web app with "Teal", an AI assistant powered by the Claude API. Built with Next.js, React and TypeScript, it uses Apify to scrape jobs from JustJoin.it — focused mostly on IT roles across Poland. The app tailors résumés from a master CV to specific IT roles of your choosing, then scores your CV against the skills and keywords found in them. Projects shown on your portfolio are managed here too, by toggling each repository's visibility.

## Overall goal

Avoid over-applying: identify gaps in your skills and offer a path to bridge them — aimed at junior developers and people just starting out.

## Features

- Job ingestion from JustJoin.it (via Apify), filtered to Poland + remote/hybrid/office
- Daily scrape (Vercel Cron) and on-demand "Scrape now"
- CV upload (PDF/DOCX) → skill extraction → readiness scoring and job matching
- AI résumé tailoring per job (Anthropic Claude), with a heuristic fallback
- GitHub project sync with per-repo portfolio visibility

## Running locally

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | Purpose | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Powers the Teal assistant (coaching + résumé tailoring) | https://console.anthropic.com → API keys |
| `APIFY_TOKEN` | Authenticates the JustJoin.it scraper that fetches job listings | https://console.apify.com → Settings → API & Integrations |
| `CRON_SECRET` | Protects the scheduled scrape route. Optional locally. Generate with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) | You generate it yourself |
| `GITHUB_USERNAME` | Whose public repositories appear on the Projects tab | Your GitHub handle (e.g. `LazyCoder02`) |

### Triggering a scrape

Click **Scrape now** in the Job Tracker, or call `POST /api/jobs/refresh`. The daily schedule is defined in `vercel.json`.

## Screenshots
![Home dashboard]([docs/screenshots/home.png](https://github.com/LazyCoder02/careerhq/blob/4474acb9dd681f430e5a1eb79c5b572c7527d620/Home.png))
![Job Tracker — discovered Poland jobs]([docs/screenshots/jobs.png](https://github.com/LazyCoder02/careerhq/blob/4474acb9dd681f430e5a1eb79c5b572c7527d620/Job%20Tracker.png))
![Résumé tailoring]([docs/screenshots/resumes.png](https://github.com/LazyCoder02/careerhq/blob/4474acb9dd681f430e5a1eb79c5b572c7527d620/Your_Resume.png))
![Teal coaching]([docs/screenshots/teal.png](https://github.com/LazyCoder02/careerhq/blob/4474acb9dd681f430e5a1eb79c5b572c7527d620/Teal.png))
