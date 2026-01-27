# Deployment Guide: Onward (Vercel + Render)

This project has two parts:
1.  **Frontend (Next.js):** Deployed to **Vercel**.
2.  **Backend Agent (Python):** Deployed to **Render**.

---

## Part 1: Environment Variables (Copy & Paste)
You will need these exact values for BOTH Vercel and Render.

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `<YOUR_SUPABASE_URL>` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<YOUR_SUPABASE_ANON_KEY>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` |
| `NEXT_PUBLIC_LIVEKIT_URL` | `<YOUR_LIVEKIT_URL>` |
| `LIVEKIT_API_KEY` | `<YOUR_LIVEKIT_KEY>` |
| `LIVEKIT_API_SECRET` | `<YOUR_LIVEKIT_SECRET>` |
| `OPENAI_API_KEY` | `<YOUR_OPENAI_KEY>` |
| `DEEPGRAM_API_KEY` | `<YOUR_DEEPGRAM_KEY>` |

---

## Part 2: Deploy Frontend to Vercel
1.  Go to [vercel.com](https://vercel.com/new).
2.  Import GitHub Repo: `simpletech310/callkeith`.
3.  **Build Settings:** Default (Framework: Next.js).
4.  **Environment Variables:** Copy/Paste all the keys from Part 1.
5.  Click **Deploy**.

---

## Part 3: Deploy Backend Agent to Render
1.  Go to [render.com](https://dashboard.render.com).
2.  Click **New +** -> **Web Service** (Required for Free Tier).
3.  Connect GitHub Repo: `simpletech310/callkeith`.
4.  **Configuration:**
    *   **Name:** `keith-agent`
    *   **Runtime:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `python scripts/keith_worker.py`
    *   **Instance Type:** Free (Note: Will spin down after 15 mins of inactivity).
5.  **Environment Variables:** Add all the keys from Part 1 here as well.
6.  Click **Create**.

---

### Verification
- **Web:** Visit your Vercel URL. The app should load.
- **Agent:** Visit `/keith` on the web app. If Render is running, Keith will answer calls!
