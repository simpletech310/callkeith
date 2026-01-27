# ... imports ...
import asyncio
import os
import json
import re
from pathlib import Path  # Added for robust path handling
from livekit import rtc, api
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import AsyncOpenAI

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
    # We can't exit here if we want to run in partial mode, but for the worker it's critical.
    # We'll let it try, but it will likely fail connection.

# Main Client (Anon or Service)
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("❌ Error: Missing Supabase Credentials")
    supabase = None

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

ROOM_NAME = 'health-help-01'
AGENT_IDENTITY = 'KEITH-AI-PY'

# State
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

async def main():
    # ... existing LiveKit connection ...
    room = rtc.Room()

    @room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        try:
             msg_str = data.data.decode("utf-8")
             msg_json = json.loads(msg_str)
             user_msg = msg_json.get("message")
             if user_msg:
                 print(f"📩 Received: {user_msg}")
                 asyncio.create_task(handle_message(room, user_msg))
        except Exception as e:
            print(f"⚠️ Error processing data: {e}")

    # Create access token
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(AGENT_IDENTITY) \
        .with_name("Keith AI") \
        .with_grants(api.VideoGrants(room_join=True, room=ROOM_NAME)) \
        .to_jwt()

    try:
        print(f"🔌 Connecting to {LIVEKIT_URL}...")
        try:
             await room.connect(LIVEKIT_URL, token)
             print(f"✅ Connected to room: {ROOM_NAME}")
        except Exception as connect_err:
             print(f"⚠️ Could not connect to LiveKit (Normal if dev/offline): {connect_err}")
             print("⚠️ Moving to generic loop for Text/Task processing.")

        # Main Loop
        print("🚀 Keith Worker Running (LiveKit + Task Polling)")
        while True:
            await poll_agent_tasks()
            await asyncio.sleep(2) # Poll every 2s
            
    except Exception as e:
        print(f"❌ Worker Error: {e}")
    finally:
        await room.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
