
import os
import sys
import json
import time
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env
load_dotenv('.env.local')
if not os.getenv("NEXT_PUBLIC_SUPABASE_URL"):
    load_dotenv('onward/.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Service role needed to create agent tasks usually? Or can anon do it?
# Let's try ANON key first as tasks might be public? No, typically internal. Use Service Key if available.
if not SUPABASE_KEY:
    SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def ask_keith(org_name):
    print(f"🤖 Asking Keith about: '{org_name}'...")
    
    # 1. Create Task
    task_payload = {
        "message": f"verify org {org_name}"
    }
    
    try:
        res = supabase.table('agent_tasks').insert({
            "assigned_agent": "Keith",
            "title": f"Verification: {org_name}", 
            "status": "pending",
            "payload": task_payload
        }).execute()
        
        if not res.data:
            print("❌ Failed to create task.")
            return
            
        task_id = res.data[0]['id']
        print(f"   Task Created: {task_id}. Waiting for Keith...")
        
        # 2. Poll for Completion
        for i in range(30): # Wait up to 60s
            check = supabase.table('agent_tasks').select('*').eq('id', task_id).execute()
            if check.data:
                task = check.data[0]
                status = task['status']
                
                if status == 'completed':
                    result = task.get('result', {})
                    response = result.get('response', 'No response text.')
                    print("\n" + "="*40)
                    print(response)
                    print("="*40 + "\n")
                    return
                elif status == 'failed':
                    print(f"\n❌ Task Failed: {task.get('result', {}).get('error', 'Unknown Error')}")
                    return
            
            await asyncio.sleep(2)
            print(".", end="", flush=True)
            
        print("\ntimeout: Keith did not respond in time (Is the worker running?)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/ask_keith.py \"<Organization Name>\"")
        sys.exit(1)
        
    org_name = sys.argv[1]
    asyncio.run(ask_keith(org_name))
