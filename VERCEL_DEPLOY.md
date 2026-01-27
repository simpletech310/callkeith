# Vercel Deployment Instructions

## 1. Deploy the Web App (Next.js)

1.  **Push to GitHub:** Ensure your latest code is pushed to `simpletech310/callkeith`.
2.  **Go to Vercel:** Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3.  **Import Repository:** Select `callkeith`.
4.  **Configure Project:**
    *   **Framework:** Next.js (should be auto-detected).
    *   **Root Directory:** `.` (default).
5.  **Environment Variables:**
    Expand the "Environment Variables" section and add the following keys. You can copy the values from your local `.env.local` file.

    | Key | Description |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon/Public Key |
    | `SUPABASE_SERVICE_ROLE_KEY` | **Critical:** Required for Admin actions & specific API routes |
    | `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit Server URL (WSS) |
    | `LIVEKIT_API_KEY` | LiveKit API Key |
    | `LIVEKIT_API_SECRET` | LiveKit API Secret |
    | `OPENAI_API_KEY` | Required if server-side AI actions are used |

6.  **Deploy:** Click **"Deploy"**.

---

## 2. Run the Keith AI Agent

The Keith Agent (`scripts/keith_worker.py`) is a **long-running process** preventing it from running on Vercel's serverless infrastructure.

### Option A: Local (Dev / Light Prod)
Keep running the script on your computer. As long as it's running, Keith will be online for anyone visiting the website.
```bash
python scripts/keith_worker.py
```

### Option B: Cloud Hosting (Production)
To keep Keith online 24/7 without your computer, deploy this repo to **Railway** or **Render**.
*   **Command:** `python scripts/keith_worker.py`
*   **Env Vars:** Same as above.
