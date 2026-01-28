# ... imports ...
import asyncio
import os
import json
import re
from pathlib import Path  # Added for robust path handling
from livekit import rtc, api, agents
from livekit.agents import JobContext, WorkerOptions, cli, JobRequest, JobExecutorType
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import AsyncOpenAI
from aiohttp import web

# Robust Environment Loading
env_path = Path('.env.local')
if not env_path.exists():
    env_path = Path('onward/.env.local')

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded environment from {env_path.absolute()}")
else:
    print("⚠️ Warning: .env.local not found. Using system environment variables.")

# Configuration
LIVEKIT_URL = os.getenv("NEXT_PUBLIC_LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not LIVEKIT_URL or not LIVEKIT_API_KEY or not OPENAI_API_KEY:
    print("❌ Error: Missing Credentials (LIVEKIT or OPENAI)")

# Main Client (Anon or Service)
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("❌ Error: Missing Supabase Credentials")
    supabase = None

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

AGENT_IDENTITY = 'KEITH-AI-PY'

# State (Per-Session Class)
class ConversationState:
    def __init__(self):
        self.history = [
            {
                "role": "system", 
                "content": (
                    "# MISSION\n"
                    "You are KEITH, an empathetic AI Case Manager for Onward.ai. Your primary purpose is to provide a non-judgmental, caring bridge between people in crisis and the specific organizations that can help them move forward.\n\n"
                    "# CORE PERSONA (The 'Kith' Philosophy)\n"
                    "- **Empathetic & Warm:** Use active listening. Validate feelings before asking for data.\n"
                    "- **Concise & Real:** Avoid corporate jargon. Speak like a supportive neighbor.\n"
                    "- **Action-Oriented:** Your goal isn't just to talk; it's to find a solution.\n\n"
                    "# CONVERSATION FLOW (Phase-Based)\n\n"
                    "## Phase 1: Empathetic Intake (TRIAGE FIRST)\n"
                    "1. **Greet & Validate:** Start with a warm greeting. If the user expresses distress, acknowledge it immediately.\n"
                    "2. **Situation Assessment:** Do NOT offer resources yet. Ask: 'To help me find the best spot for you, can you tell me a little bit about your situation and what you need most right now?'\n"
                    "3. **Establish Location:** Resources are hyper-local. You MUST confirm their City/State. Say: 'And where are you located? I want to make sure I'm looking in the right area.'\n\n"
                    "## Phase 2: Tiered Matching (THE BEST OPTION)\n"
                    "- **STRICT KNOWLEDGE BASE ADHERENCE:** Only use 'SYSTEM_RAG_RESULT' resources.\n"
                    "- **SINGLE BEST MATCH:** Do NOT list multiple options initially. Identify the *single best* organization based on their specific needs and location.\n"
                    "- **Present the Solution:** Say: 'Based on what you told me, I think [Organization Name] is your best bet. They specialize in [Service] and are located in [City].'\n"
                    "- **Offer Choice:** End with: 'Would you like to start with this one, or would you like me to look for other options?'\n\n"
                    "## Phase 3: The Handoff & Verification\n"
                    "1. **Trigger Application:** If they agree to the top match (or another selection), say: 'Great. I can send your application over to them right now so they have your details.'\n"
                    "2. **Confirm Details:** 'I have your details. I'm going to create your account and submit this application for you right now.'\n"
                    "3. **Validate:** Verify the email format (e.g., name@example.com) before proceeding. If unclear, ask for spelling.\n"
                    "4. **Execute:** Once confirmed, CALL the `create_account` function with the specific details.\n"
                    "   - **CRITICAL:** You MUST ask for and include the Phone Number.\n\n"
                    "# OPERATIONAL GUARDRAILS\n"
                    "- **NO DATA DUMPING:** Never list more than 1 resource at a time unless explicitly asked for a list.\n"
                    "- **NO UNVERIFIED RESOURCES:** Only recommend what is in your database.\n"
                    "- **ONE QUESTION RULE:** Keep the cognitive load low. One question at a time."
                )
            }
        ]

# Tool Definitions
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_account",
            "description": "Create a user account and submit an application for an organization/resource.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Full name of the user"
                    },
                    "email": {
                        "type": "string",
                        "description": "User's email address"
                    },
                    "phone": {
                        "type": "string",
                        "description": "User's phone number"
                    },
                    "program_name": {
                        "type": "string",
                        "description": "Name of the program or organization they are applying to"
                    },
                    "summary": {
                        "type": "string",
                        "description": "Brief summary of their need or situation"
                    }
                },
                "required": ["name", "email", "phone", "program_name", "summary"]
            }
        }
    }
]

def normalize_email_input(text: str) -> str:
    """Normalizes spoken email input."""
    if not text: return ""
    # Normalize common STT artifacts
    normalized = text.lower().strip()
    normalized = normalized.replace(" at ", "@").replace(" dot ", ".")
    # Remove any trailing periods often added by STT
    if normalized.endswith("."): normalized = normalized[:-1]
    return normalized

def validate_email_format(email: str) -> bool:
    """Basic regex validation for email."""
    pattern = r"[^@]+@[^@]+\.[^@]+"
    return re.match(pattern, email) is not None

async def create_magic_user(name, email, phone, program):
    """Creates a Supabase user and attaches program info."""
    print(f"👤 Creating User: {name}, {email}, {program}")
    
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot create admin user.")
        return None, None 

    try:
        admin_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        user_id = None
        try:
            attr = {
                "email": email,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": name,
                    "phone": phone,
                    "programs": [program]
                }
            }
            temp_password = str(int(os.urandom(3).hex(), 16))[:6]
            attr["password"] = temp_password
            
            response = admin_supabase.auth.admin.create_user(attr)
            user_id = response.user.id
            print(f"✅ Created New User: {user_id} with pass: {temp_password}")
            return user_id, temp_password
            
        except Exception as create_err:
            print(f"ℹ️ User creation note (likely exists): {create_err}")
            existing_id = await get_user_id_by_email(email)
            if existing_id:
                print(f"✅ Found Existing User ID: {existing_id}")
                return existing_id, "Use Existing Password"

            return None, None

    except Exception as e:
        print(f"❌ Auth Error: {e}")
        return None, None

async def get_user_id_by_email(email):
    """Helper to find User ID by Email using Admin"""
    if not SUPABASE_SERVICE_ROLE_KEY: return None
    try:
        admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        users = admin.auth.admin.list_users() 
        user_list = users.users if hasattr(users, 'users') else users
        for u in user_list:
             if u.email == email: return u.id
        return None
    except Exception as e:
        print(f"⚠️ User Lookup Error: {e}")
        return None

async def perform_rag_search(query):
    if not supabase: return []
    print(f"🔍 RAG Search for: {query}")
    final_data = []
    
    try:
        # Use wfts (Web Full Text Search) for natural language handling
        response = supabase.table('resources').select('*').filter('description', 'wfts', query).execute()
        if response.data:
            # Manual slice since limit() might fail on builder
            final_data.extend(response.data[:5])
    except Exception as e:
        print(f"⚠️ Primary Text Search Error (Falling back): {e}")
        try:
             response = supabase.table('resources').select('*').ilike('description', f"%{query}%").limit(5).execute()
             if response.data:
                 final_data.extend(response.data)
        except Exception as e2:
             print(f"⚠️ Fallback Search Error: {e2}")

    try:
        if len(final_data) < 2:
             response = supabase.table('resources').select('*').ilike('name', f"%{query}%").limit(3).execute()
             if response.data:
                 final_data.extend(response.data)
                 
        keywords = ['food', 'housing', 'legal', 'health', 'mental health', 'transportation', 'childcare', 'education', 'employment']
        query_lower = query.lower()
        matched_cat = next((cat for cat in keywords if cat in query_lower), None)
        
        if matched_cat:
            or_filter = f"category.ilike.{matched_cat},secondary_categories.cs.{{{{'{matched_cat}'}}}}"
            cat_res = supabase.table('resources').select('*').or_(or_filter).limit(10).execute()
            if cat_res.data:
                final_data.extend(cat_res.data)

        tech_keywords = ['computer', 'tech', 'it', 'coding', 'digital', 'class', 'learn']
        if any(k in query.lower() for k in tech_keywords):
             print("   -> Expanding search for Tech/Education...")
             extra_cats = supabase.table('resources').select('*').in_('category', ['education', 'employment', 'other']).limit(15).execute()
             final_data.extend(extra_cats.data or [])

        unique_map = {r['id']: r for r in final_data}
        unique_results = list(unique_map.values())
        
        query_terms = query.lower().split()
        scored_results = []
        for res in unique_results:
            score = 0
            full_text = (res.get('description', '') + ' ' + json.dumps(res.get('programs', []))).lower()
            for term in query_terms:
                if term in full_text:
                    score += 1
            contact_str = str(res.get('contact_info', '')).lower()
            if 'compton' in query_lower and 'compton' in contact_str:
                score += 5
            elif 'los angeles' in query_lower and 'los angeles' in contact_str:
                 score += 2
            scored_results.append({'doc': res, 'score': score})
            
        scored_results.sort(key=lambda x: x['score'], reverse=True)
        print(f"✅ RAG Found {len(scored_results)} candidates. Top: {[r['doc']['name'] for r in scored_results[:3]]}")
        return [item['doc'] for item in scored_results[:5]]

    except Exception as e:
        print(f"⚠️ RAG Processing Error: {e}")
        return []

async def get_ai_response(state: ConversationState, user_text):
    if not openai_client: return None

    # 1. Check for RAG triggers (only if text is provided)
    if user_text:
        context_msg = None
        if any(w in user_text.lower() for w in ['need', 'find', 'looking', 'help', 'search', 'food', 'housing', 'legal']):
            resources = await perform_rag_search(user_text)
            if resources:
                context_msg = "SYSTEM_RAG_RESULT: Found the following resources:\n"
                for res in resources:
                    process = res.get('application_process', 'Contact them directly for details.')
                    programs = json.dumps(res.get('programs', []))
                    contact = res.get('contact_info', {})
                    area = contact.get('service_area', 'Unspecified')
                    cats = [res.get('category', 'Uncategorized')]
                    sec = res.get('secondary_categories', [])
                    if sec: cats.extend(sec)
                    cat_str = ", ".join(cats)
                    
                    context_msg += (
                        f"- Name: '{res['name']}'\n"
                        f"  Categories: {cat_str}\n" 
                        f"  Service Area: {area}\n"
                        f"  Description: {res['description']}\n"
                        f"  Application Process: {process}\n"
                        f"  Available Programs: {programs}\n\n"
                    )
                context_msg += "INSTRUCTION: Explain the best match first, prioritizing LOCATION match. Mention others if they might help."
                print(f"💡 RAG Context: {context_msg[:200]}...") 

        # 2. Update History
        state.history.append({"role": "user", "content": user_text})
        if context_msg:
            state.history.append({"role": "system", "content": context_msg})

    # 3. Call OpenAI with Tools
    try:
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=state.history,
            tools=TOOLS,
            tool_choice="auto"
        )
        return completion.choices[0].message
    except Exception as e:
        print(f"❌ OpenAI Error: {e}")
        return None

async def send_message(room: rtc.Room, text):
    print(f"📤 Sent: \"{text}\"")
    payload = json.dumps({
        "message": text,
        "timestamp": int(asyncio.get_event_loop().time() * 1000)
    })
    data = payload.encode('utf-8')
    await room.local_participant.publish_data(data, reliable=True, topic="lk-chat-topic")

async def handle_message(state: ConversationState, room: rtc.Room, message):
    try:

        ai_message = await get_ai_response(state, message)
        
        if not ai_message:
            await send_message(room, "I'm having trouble connecting right now.")
            return

        # Handle Tool Calls
        if ai_message.tool_calls:
            print(f"🚀 Detected {len(ai_message.tool_calls)} Tool Call(s)")
            
            # Append the assistant's tool call message to history
            state.history.append(ai_message)

            for tool_call in ai_message.tool_calls:
                if tool_call.function.name == "create_account":
                    args = json.loads(tool_call.function.arguments)
                    print(f"   -> Processing Lead for: {args.get('name')}, Program: {args.get('program_name')}")
                    
                    # Logic
                    name = args.get('name', 'Guest')
                    email_raw = args.get('email', '')
                    phone = args.get('phone', 'N/A')
                    program = args.get('program_name', 'General Inquiry')
                    summary = args.get('summary', 'System Generated')
                    
                    email = normalize_email_input(email_raw)
                    
                    replacement_msg = ""
                    if not validate_email_format(email):
                         replacement_msg = f"[Error: The email you provided ({email}) looks incomplete.]"
                         # Feedback to tool
                         state.history.append({
                             "tool_call_id": tool_call.id,
                             "role": "tool",
                             "name": "create_account",
                             "content": json.dumps({"error": "Invalid email format. Please ask user to clarify."})
                         })
                         # Trigger AI again to explain error
                         followup = await get_ai_response(state, None) # None text means just run loop
                         if followup and followup.content:
                             await send_message(room, followup.content)
                         return

                    # Authenticated check
                    is_authenticated = any("CONTEXT UPDATE: The user is authenticated" in h.get('content', '') for h in state.history if isinstance(h, dict))

                    result_msg = ""
                    try:
                        # Logic Reuse (refactor ideal, but keeping inline for minimal diff risk)
                        # ... [Logic from previous version, adapted] ...
                        
                        # Simplify: We just run the creation logic
                        user_id = None
                        temp_pass = None
                        
                        if not is_authenticated:
                            user_id, temp_pass = await create_magic_user(name, email, phone, program)
                        else:
                            # Assume current user (in real app we'd get ID from context/session)
                            # For MVP voice, we rely on email lookup
                            user_id = await get_user_id_by_email(email)

                        if not user_id:
                             result_msg = json.dumps({"status": "error", "message": "Could not create/find user account."})
                        else:
                             # Create Lead
                             # (Resource Lookup Logic)
                             # Note: .limit() chaining might fail after text_search in some versions, using range(0,1) or just executing.
                             res_query = supabase.table('resources').select('id, name').filter('description', 'wfts', program).execute()
                             if not res_query.data:
                                  res_query = supabase.table('resources').select('id, name').ilike('description', f"%{program}%").limit(1).execute()
                             
                             rid = None
                             rname = program
                             if res_query.data:
                                 rid = res_query.data[0]['id']
                                 rname = res_query.data[0]['name']

                             if rid:
                                 existing = supabase.table('leads').select('*').eq('user_id', user_id).eq('resource_id', rid).execute()
                                 if not existing.data:
                                     supabase.table('leads').insert({
                                         "user_id": user_id,
                                         "resource_id": rid,
                                         "status": "submitted",
                                         "notes": f"{summary}\n(Source: Keith Voice Tool)"
                                     }).execute()
                                     
                                     auth_info = ""
                                     if temp_pass:
                                         base_url = os.getenv("NEXT_PUBLIC_APP_URL", "https://callkeith-git-main-teejays-projects-caad17d8.vercel.app")
                                         magic_link = f"{base_url}/magic/{user_id}"
                                         auth_info = f" Magic Link: {magic_link} | Temp Password: {temp_pass}"
                                         
                                     result_msg = json.dumps({"status": "success", "message": f"Application submitted for {rname}.{auth_info}"})
                                 else:
                                     result_msg = json.dumps({"status": "exists", "message": f"Application for {rname} already exists."})
                             else:
                                 result_msg = json.dumps({"status": "error", "message": f"Could not find resource '{program}'."})

                    except Exception as e:
                        print(f"❌ Tool Execution Error: {e}")
                        result_msg = json.dumps({"status": "error", "message": str(e)})

                    # Send Tool Output back to AI
                    state.history.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": "create_account",
                        "content": result_msg
                    })

            # Get final AI response after tool execution
            final_response = await get_ai_response(state, None)
            if final_response and final_response.content:
                 await send_message(room, final_response.content)
            
            # Check for disconnect signals
            should_disconnect = False
            for tool_call in ai_message.tool_calls:
                 if tool_call.function.name == "create_account":
                     # Check the tool result in history to see if it was success/exists
                     # We can just assume if we ran create_account, we're done.
                     # But let's check the result content we appended.
                     last_msg = state.history[-1]
                     if last_msg.get('role') == 'tool' and last_msg.get('name') == 'create_account':
                         res_data = json.loads(last_msg['content'])
                         if res_data.get('status') in ['success', 'exists']:
                             should_disconnect = True
            
            if should_disconnect:
                print("👋 Account Created/Found. Initiating Auto-Disconnect Sequence...")
                # Wait for TTS to finish speaking (approx 12 seconds for the long message)
                await asyncio.sleep(12) 
                await room.disconnect()
                print("✅ Room Disconnected.")

        else:
            # Normal Text Response
            if ai_message.content:
                state.history.append({"role": "assistant", "content": ai_message.content})
                await send_message(room, ai_message.content)

    except Exception as e:
        print(f"❌ Error processing message: {e}")

async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for LiveKit Agents.
    Called for EACH new room session.
    """
    print(f"🚀 New Keith Session: {ctx.room.name}")
    
    # Instantiate State PER SESSION
    state = ConversationState()
    
    # Connect
    await ctx.connect()
    
    room = ctx.room

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        try:
             msg_str = data.data.decode("utf-8")
             msg_json = json.loads(msg_str)
             user_msg = msg_json.get("message")
             if user_msg:
                 print(f"📩 [{ctx.room.name}] Received: {user_msg}")
                 asyncio.create_task(handle_message(state, room, user_msg))
        except Exception as e:
            print(f"⚠️ Error processing data: {e}")

    # Send Welcome Message
    initial_greeting = "Hi, I'm Keith. I'm here to help you find resources like food, housing, or legal aid. You can just talk to me like a friend—what's on your mind?"
    asyncio.create_task(send_message(room, initial_greeting))
    
    print(f"✅ Keith connected to room: {ctx.room.name}")
    
    # Wait for the room to close
    # In livekit-agents, we usually just return or await a future.
    # For a simple chat agent, we can just wait until disconnect.
    # But actually, JobContext automatically manages this.
    # We just need to set up events.

async def request_job(request: JobRequest):
    await request.accept(entrypoint)

async def health_check_server():
    """Simple HTTP server for Render Health Checks"""
    async def handle(request):
        return web.Response(text="Keith is alive and listening.")

    app = web.Application()
    app.add_routes([web.get('/', handle), web.get('/health', handle)])
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = int(os.getenv("PORT", 10000))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    print(f"🌍 HTTP Health Check running on port {port}")
    return site

if __name__ == "__main__":
    # Start Health Check in Background
    # Since cli.run_app controls the loop, we need to schedule the health check 
    # slightly differently or just run it before.
    # However, cli.run_app starts its own loop.
    # We can inject it by creating a task *inside* the loop possibly?
    # Or just run it as a separate thread? No, aiohttp is async.
    
    # Correct Pattern: Use a custom worker or start it in a pre-hook. 
    # But cli.run_app works on the main thread.
    
    # Alternative: Start the loop manually.
    # But cli.run_app is robust.
    
    # Let's try to just schedule it on the loop created by cli.run_app?
    # Actually, we can just run the health check *before* passing control to cli.
    # Wait, cli.run_app blocks.
    
    # We can define a simplified worker.
    
    async def worker_wrapper():
        # Start health check
        _server = await health_check_server()
        
        # Start Agent
        # Use new WorkerOptions
        opts = WorkerOptions(entrypoint_fnc=entrypoint)
        # Note: In newer livekit-agents 0.8+, we use cli.run_app(opts)
        # But we need to ensure we don't block health check.
        # cli.run_app manages the loop.
        
        # We can pass the loop?
        # Let's rely on standard cli usage but customize via 'run_app' internal args if needed?
        # Actually, let's just use the CLI but we need the health check.
        pass

    # Better approach:
    # Just run the health check *inside* the first job? No, because it needs to be up immediately for Render.
    
    # Best MVP:
    # Create the loop, start health check task, then run app.
    # But run_app creates loop.
    
    # Let's inspect livekit.agents.
    # We'll stick to the recommended pattern but use a background task hook if available.
    
    # Actually, we can use `asyncio.new_event_loop` logic manually if we want full control,
    # but `cli.run_app` is safer.
    
    # Let's try to cheat:
    # Define a minimal shim that starts the server then calls run_app?
    # No, run_app expects to own the entrypoint.
    
    # For now, let's just add the health check server startup to the TOP of `entrypoint`?
    # No, entrypoint is per job.
    
    # Let's use the `pre_shutdown` hook or similar? No.
    
    # Let's just run the health check on a separate thread/loop? 
    # Or just spawn it in the global event loop?
    
    # Actually, standard python generic:
    # loop = asyncio.get_event_loop() ...
    
    # Let's assume cli.run_app uses the current loop if running?
    # Docs say: "It will create a new event loop if one is not running."
    
    pass

    # Final Decision:
    # We will start the health check inside a standard asyncio run manually, 
    # and use `Worker` class directly instead of `cli`.
    # This gives us control over the loop.
    
async def main_worker():
    # 1. Start Health Check Server (Background Task)
    # We use a separate thread for the health check so it doesn't block the agent worker
    import threading

    def run_health_check_thread():
         loop = asyncio.new_event_loop()
         asyncio.set_event_loop(loop)
         loop.run_until_complete(health_check_server())
         loop.run_forever()
         
    t = threading.Thread(target=run_health_check_thread, daemon=True)
    t.start()
    print("✅ Health Check Thread Started")
    
    # 2. Start LiveKit Worker
    # cli.run_app() is designed to run the main event loop. 
    # Since we are already inside an async function 'main_worker' (if we were called async),
    # this would be tricky. BUT we call this from __main__ synchronously via asyncio.run?
    # NO, cli.run_app() SHOULD be the entry point.
    
    # Let's adjust:
    # We will invoke cli.run_app() directly in __main__.
    
    pass

if __name__ == "__main__":
    # 1. Start Health Check in a Daemon Thread
    # This ensures it runs independently of the main Agent loop
    import threading
    
    def run_health_check_thread():
         loop = asyncio.new_event_loop()
         asyncio.set_event_loop(loop)
         loop.run_until_complete(health_check_server())
         loop.run_forever()
         
    t = threading.Thread(target=run_health_check_thread, daemon=True)
    t.start()

    # 2. Run the Agent Worker
    # cli.run_app handles the asyncio loop and signal handling for us.
    print("🚀 Starting Keith Agent Worker (LiveKit Agents)...")
    # Use THREAD worker type to avoid Process Pool timeouts on Render Free Tier
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, job_executor_type=JobExecutorType.THREAD))
    def __init__(self):
        self.history = [
            {
                "role": "system", 
                "content": (
                    "# MISSION\n"
                    "You are KEITH, an empathetic AI Case Manager for Onward.ai. Your primary purpose is to provide a non-judgmental, caring bridge between people in crisis and the specific organizations that can help them move forward.\n\n"
                    "# CORE PERSONA (The 'Kith' Philosophy)\n"
                    "- **Empathetic & Warm:** Use active listening. Validate feelings before asking for data.\n"
                    "- **Concise & Real:** Avoid corporate jargon. Speak like a supportive neighbor.\n"
                    "- **Action-Oriented:** Your goal isn't just to talk; it's to find a solution.\n\n"
                    "# CONVERSATION FLOW (Phase-Based)\n\n"
                    "## Phase 1: Empathetic Intake (TRIAGE FIRST)\n"
                    "1. **Greet & Validate:** Start with a warm greeting. If the user expresses distress, acknowledge it immediately.\n"
                    "2. **Situation Assessment:** Do NOT offer resources yet. Ask: 'To help me find the best spot for you, can you tell me a little bit about your situation and what you need most right now?'\n"
                    "3. **Establish Location:** Resources are hyper-local. You MUST confirm their City/State. Say: 'And where are you located? I want to make sure I'm looking in the right area.'\n\n"
                    "## Phase 2: Tiered Matching (THE BEST OPTION)\n"
                    "- **STRICT KNOWLEDGE BASE ADHERENCE:** Only use 'SYSTEM_RAG_RESULT' resources.\n"
                    "- **SINGLE BEST MATCH:** Do NOT list multiple options initially. Identify the *single best* organization based on their specific needs and location.\n"
                    "- **Present the Solution:** Say: 'Based on what you told me, I think [Organization Name] is your best bet. They specialize in [Service] and are located in [City].'\n"
                    "- **Offer Choice:** End with: 'Would you like to start with this one, or would you like me to look for other options?'\n\n"
                    "## Phase 3: The Handoff & Verification\n"
                    "1. **Trigger Application:** If they agree to the top match (or another selection), say: 'Great. I can send your application over to them right now so they have your details.'\n"
                    "2. **Verify Identity:** 'I just need to verify it's you. I'm sending a quick code to this phone number now.'\n"
                    "3. **Execute Command:** Once confirmed, trigger: `[CREATE_ACCOUNT|Name|Email|Phone|Program Name|Summary]`\n\n"
                    "# OPERATIONAL GUARDRAILS\n"
                    "- **NO DATA DUMPING:** Never list more than 1 resource at a time unless explicitly asked for a list.\n"
                    "- **NO UNVERIFIED RESOURCES:** Only recommend what is in your database.\n"
                    "- **ONE QUESTION RULE:** Keep the cognitive load low. One question at a time."
                )
            }
        ]

state = ConversationState()

async def create_magic_user(name, email, phone, program):
    """Creates a Supabase user and attaches program info."""
    print(f"👤 Creating User: {name}, {email}, {program}")
    
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot create admin user.")
        return None, None # Return None to signal failure instead of invalid UUID

    try:
        # Admin Client for User Management
        admin_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # 1. Try to create user (auto-confirm email)
        user_id = None
        try:
            attr = {
                "email": email,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": name,
                    "phone": phone,
                    "programs": [program] # Initial program
                }
            }
            # Generate a simple 6-digit temp password for MVP ease of use
            temp_password = str(int(os.urandom(3).hex(), 16))[:6]
            attr["password"] = temp_password
            
            response = admin_supabase.auth.admin.create_user(attr)
            user_id = response.user.id
            print(f"✅ Created New User: {user_id} with pass: {temp_password}")
            return user_id, temp_password
            
        except Exception as create_err:
            print(f"ℹ️ User creation note (likely exists): {create_err}")
            # Try to get existing user
            existing_id = await get_user_id_by_email(email)
            if existing_id:
                print(f"✅ Found Existing User ID: {existing_id}")
                return existing_id, "Use Existing Password"

            return None, None # Failed to create or find

    except Exception as e:
        print(f"❌ Auth Error: {e}")
        return None, None

async def get_user_id_by_email(email):
    """Helper to find User ID by Email using Admin"""
    if not SUPABASE_SERVICE_ROLE_KEY: return None
    try:
        admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        users = admin.auth.admin.list_users() # Gets first 50
        
        # Fallback for pagination struct
        user_list = users.users if hasattr(users, 'users') else users
        
        for u in user_list:
             if u.email == email: return u.id
                 
        return None
    except Exception as e:
        print(f"⚠️ User Lookup Error: {e}")
        return None

async def perform_rag_search(query):
    if not supabase: return []
    print(f"🔍 RAG Search for: {query}")
    print(f"🔍 RAG Search for: {query}")
    final_data = []
    
    # 1. Primary Text Search on Description
    try:
        # Note: Removing explicit config to avoid clientcompat issues. 
        # Default usually works or we fall back to ilike.
        response = supabase.table('resources') \
            .select('*') \
            .text_search('description', query) \
            .limit(5) \
            .execute()
        if response.data:
            final_data.extend(response.data)
            
    except Exception as e:
        print(f"⚠️ Primary Text Search Error (Falling back): {e}")
        # Fallback to ilike immediately if text_search fails
        try:
             response = supabase.table('resources').select('*').ilike('description', f"%{query}%").limit(5).execute()
             if response.data:
                 final_data.extend(response.data)
        except Exception as e2:
             print(f"⚠️ Fallback Search Error: {e2}")

    try:
        # 2. Secondary/Fallback Search (Name)
        # Often users search by name
        if len(final_data) < 2:
             response = supabase.table('resources').select('*').ilike('name', f"%{query}%").limit(3).execute()
             if response.data:
                 final_data.extend(response.data)
                 
        # 3. Explicit check on Secondary Categories
        keywords = ['food', 'housing', 'legal', 'health', 'mental health', 'transportation', 'childcare', 'education', 'employment']
        query_lower = query.lower()
        matched_cat = next((cat for cat in keywords if cat in query_lower), None)
        
        if matched_cat:
            # FIX: Search BOTH Main Category AND Secondary Categories
            # Syntax: category.eq.food,secondary_categories.cs.{food}
            or_filter = f"category.ilike.{matched_cat},secondary_categories.cs.{{{{'{matched_cat}'}}}}"
            cat_res = supabase.table('resources').select('*').or_(or_filter).limit(10).execute()
            if cat_res.data:
                final_data.extend(cat_res.data)

        # 4. Deep Search in 'Programs' (Client-side filtering for JSONB content)
        # Scan for tech keywords manually to broaden scope if needed
        tech_keywords = ['computer', 'tech', 'it', 'coding', 'digital', 'class', 'learn']
        if any(k in query.lower() for k in tech_keywords):
             print("   -> Expanding search for Tech/Education...")
             extra_cats = supabase.table('resources').select('*').in_('category', ['education', 'employment', 'other']).limit(15).execute()
             final_data.extend(extra_cats.data or [])

        # Deduplicate list by ID
        unique_map = {r['id']: r for r in final_data}
        unique_results = list(unique_map.values())
        
        # 5. Re-Ranking based on full content (Description + Programs)
        query_terms = query.lower().split()
        
        scored_results = []
        for res in unique_results:
            score = 0
            # Convert full object to text for scoring
            full_text = (res.get('description', '') + ' ' + json.dumps(res.get('programs', []))).lower()
            
            # Simple keyword match
            for term in query_terms:
                if term in full_text:
                    score += 1
            
            # Boost for explicit location match
            contact_str = str(res.get('contact_info', '')).lower()
            if 'compton' in query_lower and 'compton' in contact_str:
                score += 5
            elif 'los angeles' in query_lower and 'los angeles' in contact_str:
                 score += 2
                
            scored_results.append({'doc': res, 'score': score})
            
        # Sort by score descending
        scored_results.sort(key=lambda x: x['score'], reverse=True)
        
        print(f"✅ RAG Found {len(scored_results)} candidates. Top: {[r['doc']['name'] for r in scored_results[:3]]}")
        
        # Return top 5
        return [item['doc'] for item in scored_results[:5]]

    except Exception as e:
        print(f"⚠️ RAG Processing Error: {e}")
        return []

async def get_ai_response(user_text):
    if not openai_client: return "I'm having trouble thinking right now. Please check my configuration."

    # 1. Check for RAG triggers
    context_msg = None
    if any(w in user_text.lower() for w in ['need', 'find', 'looking', 'help', 'search', 'food', 'housing', 'legal']):
        resources = await perform_rag_search(user_text)
        if resources:
            context_msg = "SYSTEM_RAG_RESULT: Found the following resources:\n"
            for res in resources:
                process = res.get('application_process', 'Contact them directly for details.')
                programs = json.dumps(res.get('programs', []))
                contact = res.get('contact_info', {})
                area = contact.get('service_area', 'Unspecified')
                
                # Format Categories
                cats = [res.get('category', 'Uncategorized')]
                sec = res.get('secondary_categories', [])
                if sec: cats.extend(sec)
                cat_str = ", ".join(cats)
                
                context_msg += (
                    f"- Name: '{res['name']}'\n"
                    f"  Categories: {cat_str}\n" 
                    f"  Service Area: {area}\n"
                    f"  Description: {res['description']}\n"
                    f"  Application Process: {process}\n"
                    f"  Available Programs: {programs}\n\n"
                )
            context_msg += "INSTRUCTION: Explain the best match first, prioritizing LOCATION match. Mention others if they might help."
            
            print(f"💡 RAG Context: {context_msg[:200]}...") # Log first 200 chars

    # 2. Update History
    state.history.append({"role": "user", "content": user_text})
    if context_msg:
        state.history.append({"role": "system", "content": context_msg})

    # 3. Call OpenAI
    try:
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=state.history
        )
        reply = completion.choices[0].message.content
        state.history.append({"role": "assistant", "content": reply})
        return reply
    except Exception as e:
        print(f"❌ OpenAI Error: {e}")
        return "I'm having trouble connecting to my brain right now, but I'm here to help."

async def send_message(room, text):
    print(f"📤 Sent: \"{text}\"")
    payload = json.dumps({
        "message": text,
        "timestamp": int(asyncio.get_event_loop().time() * 1000)
    })
    data = payload.encode('utf-8')
    await room.local_participant.publish_data(data, reliable=True, topic="lk-chat-topic")

async def handle_message(room, message):
    try:
        # Get AI Response
        response_text = await get_ai_response(message)
        
        # Process [CREATE_ACCOUNT] token
        # Regex updated to capture 5 groups: Name, Email, Phone, Program, Summary
        matches = list(re.finditer(r"\[CREATE_ACCOUNT\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]", response_text))
        
        if matches:
            print(f"🚀 Detected {len(matches)} Account/Lead Creation Request(s)")
            
            # We need to process each match. 
            # CAUTION: Single response text update might be tricky if we replace token 1 then token 2 positions shift?
            # Actually string replacement by value is safer if unique, or we reconstruct the string.
            # For simplicity, we'll iterate and replace match strings with status updates.
            
            final_response_text = response_text
            
            # Check authentication once (context based) - assuming typical session
            is_authenticated = any("CONTEXT UPDATE: The user is authenticated" in h.get('content', '') for h in state.history)
            
            for match in matches:
                full_token = match.group(0)
                name, email, phone, program, summary = match.groups()
                
                print(f"   -> Processing Lead for: {name}, Program: {program}")
                
                replacement_msg = ""
    
                if is_authenticated:
                     # Returning User Flow
                     try:
                         # Search for resource
                         res_query = supabase.table('resources').select('id, name').text_search('description', program, config='english').limit(1).execute()
                         if not res_query.data:
                              res_query = supabase.table('resources').select('id, name').ilike('description', f"%{program}%").limit(1).execute()
                         
                         if res_query.data:
                             resource = res_query.data[0]
                             rid = resource['id']
                             rname = resource['name']
                             
                             real_user_id = await get_user_id_by_email(email)
                             
                             if not real_user_id:
                                 print(f"❌ Could not resolve ID for {email}")
                                 replacement_msg = f"[Error: Could not verify account for {program}. Please log in manually.]"
                             else:
                                 # Check for Duplicate
                                 existing_lead = supabase.table('leads') \
                                    .select('*') \
                                    .eq('user_id', real_user_id) \
                                    .eq('resource_id', rid) \
                                    .in_('status', ['new', 'submitted', 'acknowledged', 'accepted', 'on_hold']) \
                                    .execute()
                                    
                                 if existing_lead.data:
                                     replacement_msg = f"\n[Status: You already have an active application for **{rname}**.]\n"
                                 else:
                                     # Create New Lead with Summary in Notes
                                    new_lead = {
                                        "user_id": real_user_id,
                                        "resource_id": rid,
                                        "status": "submitted",
                                        "notes": f"{summary}\n(Source: Keith Voice Agent)"
                                    }
                                    supabase.table('leads').insert(new_lead).execute()
                                    replacement_msg = f"\n[Success: I've submitted your request for **{rname}**.]\n"
                             
                         else:
                             replacement_msg = f"[Error: Could not match program '{program}' to a database resource.]"
                     except Exception as lead_err:
                         print(f"❌ Lead Creation Error: {lead_err}")
                         replacement_msg = f"[Error: System issue submitting for {program}.]"
    
                else:
                    # New User Flow
                    # Note: If multiple 'CREATE_ACCOUNT' tokens exist for a NEW user, we might try to create the user multiple times.
                    # 'create_magic_user' handles "existing user" gracefully, returning the ID.
                    user_id, temp_pass = await create_magic_user(name, email, phone, program)
                    
                    if not user_id:
                        replacement_msg = f"[Error: Could not create account for {program}. Please apply on our website.]"
                    else:
                        # INSERT LEAD FOR NEW USER
                        try:
                             res_query = supabase.table('resources').select('id, name').text_search('description', program, config='english').limit(1).execute()
                             if not res_query.data:
                                  res_query = supabase.table('resources').select('id, name').ilike('description', f"%{program}%").limit(1).execute()
                             
                             if res_query.data:
                                 resource = res_query.data[0]
                                 rid = resource['id']
                                 rname = resource['name'] # Keep var name consistent
                                 
                                 existing_lead = supabase.table('leads').select('*').eq('user_id', user_id).eq('resource_id', rid).execute()
                                 
                                 if not existing_lead.data:
                                     new_lead = {
                                         "user_id": user_id,
                                         "resource_id": rid,
                                         "status": "submitted",
                                         "notes": f"{summary}\n(Source: Keith Voice Agent - New User Flow)"
                                     }
                                     supabase.table('leads').insert(new_lead).execute()
                                     print(f"✅ Created Lead for New/Guest User: {user_id}")
                                     
                                     # Only show magic link info ONCE if multiple leads? 
                                     # We'll just append it every time, user will see it repeatedly but that's safe.
                                     magic_link = f"http://localhost:3000/magic/{user_id}"
                                     replacement_msg = (
                                         f"\n\n[Success: Request submitted for **{rname}**.]\n"
                                         f"Access Dashboard: [Magic Link]({magic_link})\n"
                                         f"Temp Password: `{temp_pass}`" 
                                     )
                                 else:
                                     replacement_msg = f"\n[Status: Application for **{rname}** already exists.]\n"
    
                        except Exception as e:
                            print(f"⚠️ Failed to insert lead for new user: {e}")
                            replacement_msg = f"[Error: Failed to submit application for {program}.]"
                
                # Replace the specific token in the text
                final_response_text = final_response_text.replace(full_token, replacement_msg)
            
            await send_message(room, final_response_text)
        else:
            await send_message(room, response_text)

    finally:
        await room.disconnect()

async def handle_playground_task(task):
    """Processes a text-based task from the admin playground."""
    print(f"🤖 Processing Playground Task: {task['id']}")
    
    # 1. Extract Message
    try:
        payload = task.get('payload', {})
        user_message = payload.get('message', '')
        
        if not user_message:
            raise ValueError("No message in payload")
        
        user_message = user_message.strip()
            
        # 2. Update Task to In-Progress
        supabase.table('agent_tasks').update({'status': 'in-progress'}).eq('id', task['id']).execute()
        
        response_text = ""
        
        # 3a. Check for Admin Systems Test (Playground Only)
        msg_lower = user_message.lower()
        print(f"DEBUG: Processing '{user_message}' (Lower: '{msg_lower}')")
        
        if any(trigger in msg_lower for trigger in ["system test", "systems test", "check resource catalog", "test system"]):
             try:
                 # Count Resources
                 res_count = supabase.table('resources').select('*', count='exact', head=True).execute().count
                 
                 # Fetch Last 15 Resources
                 recent_res = supabase.table('resources').select('name, category, created_at').order('created_at', desc=True).limit(15).execute()
                 
                 # Fetch All Categories (via resources for now)
                 cat_res = supabase.table('resources').select('category').execute()
                 # unique categories
                 categories = sorted(list(set(r['category'] for r in cat_res.data if r.get('category'))))
                 
                 import datetime
                 now_str = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")
                 
                 # Format Recent Orgs
                 orgs_list = "\n".join([f"- **{r['name']}** ({r['category']})" for r in recent_res.data])
                 
                 # Format Categories
                 cats_list = ", ".join([f"`{c}`" for c in categories])
                 
                 response_text = (
                     f"✅ **SYSTEMS TEST PASSED**\n\n"
                     f"**Authenticated Admin Session**\n"
                     f"Connected to Knowledge Base at {now_str}.\n\n"
                     f"### 📊 Statistics\n"
                     f"- **Total Organizations**: {res_count}\n"
                     f"- **Active Categories**: {len(categories)}\n\n"
                     f"### 🆕 Recent Organizations (Last 15)\n"
                     f"{orgs_list}\n\n"
                     f"### 📂 All Categories\n"
                     f"{cats_list}\n\n"
                     f"I am initialized and ready to verify leads."
                 )
             except Exception as e:
                 response_text = f"❌ Systems Test Failed: {e}"

        # 3b. Show System Prompt
        elif "show system prompt" in msg_lower:
            try:
                # Get the system prompt from the global state source of truth
                current_prompt = state.history[0]['content']
                
                # Get file modification time
                import os
                import datetime
                file_stats = os.stat(__file__)
                last_updated = datetime.datetime.fromtimestamp(file_stats.st_mtime).strftime("%B %d, %Y at %I:%M %p")
                
                response_text = (
                    f"### 🧠 KEITH System Prompt\n"
                    f"**Last Updated Logic**: {last_updated}\n\n"
                    f"```text\n"
                    f"{current_prompt}\n"
                    f"```"
                )
            except Exception as e:
                 response_text = f"❌ Could not retrieve system prompt: {e}"

        # 3c. Verify Organization Command
        elif msg_lower.startswith("verify org"):
            try:
                # Extract org name
                # "verify org [name]" -> splice 11:
                org_name = user_message[11:].strip()
                print(f"🔍 Verifying Organization: {org_name}")
                
                if not org_name:
                    response_text = "❌ Error: Please specify an organization name. Usage: `verify org [Organization Name]`"
                else:
                    # Search DB
                    # Try exact match first
                    res_query = supabase.table('resources').select('*').ilike('name', org_name).execute()
                    
                    if not res_query.data:
                         # Try fuzzy search
                         res_query = supabase.table('resources').select('*').ilike('name', f"%{org_name}%").limit(1).execute()
                    
                    if res_query.data:
                        org = res_query.data[0]
                        
                        # Extract Details
                        name = org.get('name', 'N/A')
                        desc = org.get('description', 'N/A')
                        category = org.get('category', 'N/A')
                        
                        sec_cats = org.get('secondary_categories', [])
                        sec_cats_str = ", ".join(sec_cats) if sec_cats else "None"
                        
                        contact = org.get('contact_info', {}) or {}
                        service_area = contact.get('service_area', 'Unspecified')
                        website = contact.get('website', 'N/A')
                        
                        programs_raw = org.get('programs', [])
                        programs_str = "No specific programs listed."
                        if programs_raw:
                            programs_list = [f"- **{p.get('name', 'Unnamed')}**: {p.get('description', 'No description')}" for p in programs_raw]
                            programs_str = "\n".join(programs_list)
                            
                        response_text = (
                            f"✅ **Organization Verified**\n\n"
                            f"**Name**: {name}\n"
                            f"**Category**: {category}\n"
                            f"**Secondary Categories**: {sec_cats_str}\n"
                            f"**Service Area**: {service_area}\n"
                            f"**Website**: {website}\n\n"
                            f"**Summary**:\n{desc}\n\n"
                            f"**Programs**:\n{programs_str}"
                        )
                    else:
                        response_text = f"❌ Organization not found: '{org_name}'. Please check the spelling or add it to the database."

            except Exception as e:
                print(f"❌ Verification Error: {e}")
                response_text = f"❌ Error verifying organization: {e}"
        
        # 3c. Standard AI Response
        else:
            response_text = await get_ai_response(user_message)
        
        # 4. Check for Leads (Text only check)
        matches = list(re.finditer(r"\[CREATE_ACCOUNT\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]", response_text))
        if matches:
            response_text += "\n\n[SYSTEM NOTE: Lead generation tokens detected and would be processed in live mode.]"

        # 5. Complete Task
        supabase.table('agent_tasks').update({
            'status': 'completed',
            'result': {'response': response_text}
        }).eq('id', task['id']).execute()
        
        print(f"✅ Completed Task: {task['id']}")

    except Exception as e:
        print(f"❌ Task Failed: {e}")
        supabase.table('agent_tasks').update({
            'status': 'failed',
            'result': {'error': str(e)}
        }).eq('id', task['id']).execute()

async def poll_agent_tasks():
    """Polls Supabase for pending tasks assigned to Keith."""
    if not supabase: return
    
    try:
        response = supabase.table('agent_tasks') \
            .select('*') \
            .eq('assigned_agent', 'Keith') \
            .eq('status', 'pending') \
            .execute()
            
        tasks = response.data or []
        for task in tasks:
            asyncio.create_task(handle_playground_task(task))
            
    except Exception as e:
        print(f"⚠️ Polling Error: {e}")

async def health_check_server():
    """Simple HTTP server for Render Health Checks"""
    from aiohttp import web
    
    async def handle(request):
        return web.Response(text="Keith is alive and listening.")

    app = web.Application()
    app.add_routes([web.get('/', handle), web.get('/health', handle)])
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    # Render provides PORT in env, default to 10000 if local
    port = int(os.getenv("PORT", 10000))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    print(f"🌍 HTTP Health Check running on port {port}")
    return site  # Return site to prevent GC


