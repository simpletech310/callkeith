
import asyncio
import os
import sys
import json
from supabase import create_client

# Simple script to send a chat message task to Keith for RAG testing.

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://placeholder.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

from dotenv import load_dotenv
load_dotenv('.env.local') or load_dotenv('onward/.env.local')
# Re-fetch after load
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Key missing")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def test_chat(message):
    print(f"🤖 User: {message}")
    
    # Create Task
    res = supabase.table('agent_tasks').insert({
        "assigned_agent": "Keith",
        "title": "Test Chat",
        "status": "pending",
        "payload": {"message": message}
    }).execute()
    
    task_id = res.data[0]['id']
    print(f"   Task Created: {task_id}. Waiting...")
    
    # Poll
    for _ in range(30):
        await asyncio.sleep(2)
        task = supabase.table('agent_tasks').select('*').eq('id', task_id).single().execute()
        if task.data['status'] == 'completed':
            result = task.data['result']
            print("\n========================================")
            print(result.get('response', 'No response'))
            print("========================================\n")
            return
        elif task.data['status'] == 'failed':
            print("❌ Failed")
            return
            
    print("❌ Timed out")

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "I need help finding a computer class in Compton."
    asyncio.run(test_chat(msg))
