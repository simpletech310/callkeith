import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
user_id = "5b6097b9-ff82-40f0-beb8-4c723ceac49c"

try:
    supabase.auth.admin.update_user_by_id(user_id, {"password": "147359"})
    print("✅ Password reset to '147359'")
except Exception as e:
    print(f"❌ Error: {e}")
