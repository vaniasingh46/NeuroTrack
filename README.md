# NeuroTrack Backend (P3)

Node.js + Express + Supabase (PostgreSQL) backend for the mobile → API → dashboard pipeline.

## Requirements

- **Node.js**: v18.0.0 or higher (supports native `fetch` used in verification scripts)
- **npm**: v9.0.0 or higher
- **Supabase**: A Supabase project with `public.users` and `public.sessions` tables configured

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the project root:
   ```env
   PORT=4000
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
   > **Note**: Ensure `SUPABASE_URL` contains the base project URL without any `/rest/v1/` path suffix.

3. **Supabase Database Schema & Migration**:
   In baseline calibration, initial calibration sessions (sessions 1 & 2 before the baseline locks) intentionally have a `null` score because there is no baseline to score against yet. Ensure `public.sessions.score` is nullable by running the following migration in your **Supabase Dashboard -> SQL Editor**:

   ```sql
   -- migrations/001_make_sessions_score_nullable.sql
   ALTER TABLE public.sessions
   ALTER COLUMN score DROP NOT NULL;
   ```

## Starting the Server

- **Production / Standard mode**:
  ```bash
  npm start
  ```
- **Development mode** (auto-reload via nodemon):
  ```bash
  npm run dev
  ```

Server listens on `http://localhost:4000` by default (or the port specified by `PORT`).

## Available npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Runs the API server using Node. |
| `npm run dev` | `nodemon server.js` | Runs the API server with auto-reload on file changes. |
| `npm run verify:session-post` | `node scripts/verify-session-post.js` | Runs the automated POST/GET verification flow using Node's native `fetch`. |

On Windows, `npm.cmd` can also be used directly:
```cmd
npm.cmd run verify:session-post
```

## Running the Verification Script

With the server running on `http://localhost:4000`, run the verification script in a separate terminal:

```bash
npm run verify:session-post
```

*(Windows Command Prompt / PowerShell: `npm.cmd run verify:session-post`)*

The script:
1. Submits 3 consecutive calibration/scoring payloads to `POST /api/sessions` for disposable test user `post-verify-20260907-001`.
2. Verifies calibration progress (`1/3` -> `2/3` -> `3/3`) and baseline locking on the 3rd submission.
3. Queries and verifies:
   - `GET /api/users/post-verify-20260907-001`
   - `GET /api/sessions/post-verify-20260907-001`
   - `GET /api/sessions/post-verify-20260907-001/latest`
4. Stops immediately if any request fails.

## Data Model

The application consolidates data on two primary Supabase tables:

- **`public.users`** — One row per patient. Holds identity, `baseline_score` (default 80), and the personal **`baseline`** JSON per modality (tremor, spiral, tapping) updated incrementally via Welford's algorithm. The baseline locks once each modality reaches 3+ valid calibration sessions.
- **`public.sessions`** — One row per test sitting. Stores derived features only (no raw sensor streams leave the phone). Each test has a `quality` flag from server-side validation. Once the baseline is locked, the session stores a transparent composite score (0–100 weighted z-score against personal baseline) and sub-scores.

## API Endpoints

### Health Check
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server status and ISO timestamp |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/:userId` | Fetch user profile and baseline |
| POST | `/api/users` | Create user `{ userId, displayName?, email?, condition? }` |
| POST | `/api/users/:userId/recalibrate` | Reset baseline to rebuild from scratch |

### Sessions
| Method | Path | Description |
|---|---|---|
| POST | `/api/sessions` | Submit a new session (calibration or live scored) |
| GET | `/api/sessions/:userId?limit=&since=&validOnly=` | Session history for trend dashboards |
| GET | `/api/sessions/:userId/latest` | Most recent valid session |

### POST /api/sessions Body Format

```json
{
  "userId": "demo-user-001",
  "tremor": {
    "amplitude": 0.2,
    "dominantFreqHz": 4.5,
    "durationSec": 10
  },
  "spiral": {
    "deviationScore": 25,
    "completionTimeSec": 9,
    "pointCount": 150
  },
  "tapping": {
    "tapCount": 60,
    "durationSec": 10,
    "interTapIntervalVarianceMs": 18
  },
  "isCalibrationSession": false,
  "notes": "Evening testing session"
}
```

Any subset of the three test modalities may be submitted — composite scoring renormalizes weights across whichever modalities are present and pass quality checks.

## Data-Quality Validation

`utils/qualityCheck.js` re-validates every submitted test server-side (duration too short, motion too low/high, spiral cut short, etc.) even though the phone flags this on-device — never trusting the client alone for data feeding a clinical dashboard. A session is marked invalid only if *none* of its submitted tests pass; partially valid sessions still contribute valid tests to baseline and composite scoring.

## Composite Scoring

`utils/scoring.js` implements a transparent, rules-based weighted index — not a black-box model — allowing the UI to present a "why this score" breakdown (radar/bar chart of tremor/spiral/tapping sub-scores). Weights: tremor 0.4, spiral 0.3, tapping 0.3, dynamically renormalized across contributing modalities.

## Baseline Building

`utils/baseline.js` uses Welford's online algorithm to update mean/std incrementally per modality as calibration sessions arrive, locking once each modality reaches 3+ valid samples (`MIN_SAMPLES_TO_LOCK`). Use `POST /api/users/:userId/recalibrate` to rebuild baseline from scratch (e.g. after a medication change).
