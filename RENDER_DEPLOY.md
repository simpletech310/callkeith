# Deploying Keith to Render

This guide outlines how to deploy the **Keith Voice Agent** (`keith_worker.py`) to [Render.com](https://render.com) as a **Web Service** (Free Tier).

## Prerequisites

- A [Render.com](https://render.com) account.
- This repository connected to your Render account.
- API Keys for LiveKit, Supabase, and OpenAI.

## Deployment Steps

### 1. New Blueprint Instance
1.  Go to your Render Dashboard.
2.  Click **New +** and select **Blueprint**.
3.  Connect this repository.
4.  Render will automatically detect the `render.yaml` file.

### 2. Service Configuration
You will see a service named `keith-agent` (**Web Service**).
Render will prompt you to input the values for the Environment Variables defined in `render.yaml`.

> [!IMPORTANT]
> Since this is a **Web Service** on the Free Tier, it will "spin down" after 15 minutes of inactivity. The first time you call it after a break, it might take 30-60 seconds to wake up.

**Required Variables**:
-   `NEXT_PUBLIC_LIVEKIT_URL`: Your LiveKit WebSocket URL.
-   `LIVEKIT_API_KEY`: Your LiveKit API Key.
-   `LIVEKIT_API_SECRET`: Your LiveKit API Secret.
-   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
-   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase **Service Role** Key (Required for admin tasks like creating magic users).
-   `OPENAI_API_KEY`: Your OpenAI API Key.

### 3. Deploy
1.  Click **Apply**.
2.  Render will verify the configuration and start the deployment.
3.  It will install dependencies from `requirements.txt`.
4.  It will start the worker using `python scripts/keith_worker.py`.

## Verification
1.  Go to the **Logs** tab of the `keith-agent` service.
2.  Wait for the startup messages:
    ```text
    ✅ Loaded environment from ...
    🔌 Connecting to ...
    ✅ Connected to room: health-help-01
    🚀 Keith Worker Running (LiveKit + Task Polling)
    ```
3.  The agent is now live and listening!

## Notes
-   **Auto-Deploy**: in `render.yaml`, `autoDeploy` is set to `false` to prevent accidental restarts on every commit. You can change this to `true` in the dashboard or the YAML if you prefer continuous deployment.
-   **Resources**: A standard "Starter" or "Standard" instance on Render is usually sufficient for this worker.
