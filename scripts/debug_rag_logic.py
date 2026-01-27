
import os
import sys
import json
from supabase import create_client

from dotenv import load_dotenv
load_dotenv('.env.local') or load_dotenv('onward/.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_KEY:
    print("❌ Key missing")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_rag(query):
    print(f"🔎 Query: '{query}'")
    
    # 1. Broad Category Fetch (Simulating the worker logic)
    tech_keywords = ['computer', 'tech', 'it', 'coding', 'digital']
    final_data = []
    
    # Primary Text Search
    try:
        res = supabase.table('resources').select('*').text_search('description', query, config='english').limit(5).execute()
        final_data.extend(res.data or [])
        print(f"   [Text Search] Found: {len(res.data)} items")
    except Exception as e:
        print(f"   [Text Search] Error: {e}")

    # Tech Expansion
    if any(k in query.lower() for k in tech_keywords):
         print("   [Logic] Tech keywords detected. Expanding to 'education', 'employment'...")
         extra = supabase.table('resources').select('*').in_('category', ['education', 'employment', 'other']).limit(20).execute()
         print(f"   [Expansion] Found: {len(extra.data)} items in eligible categories.")
         final_data.extend(extra.data or [])

    # Dedupe
    unique_map = {r['id']: r for r in final_data}
    unique_results = list(unique_map.values())
    print(f"   [Total Candidates] {len(unique_results)} unique items")

    # Ranking
    query_terms = query.lower().split()
    scored_results = []
    
    print("\n   --- Scoring ---")
    for res in unique_results:
        score = 0
        desc = res.get('description', '') or ''
        progs = json.dumps(res.get('programs', [])).lower()
        full_text = (desc + ' ' + progs).lower()
        
        # Term match
        matches = []
        for term in query_terms:
            if term in full_text:
                score += 1
                matches.append(term)
        
        # Location Boost
        if 'compton' in query.lower() and 'compton' in str(res.get('contact_info', '')).lower():
            score += 5
            matches.append("LOCATION_BOOST")
            
        scored_results.append({'doc': res, 'score': score, 'matches': matches})
        print(f"   ID: {res['id'][:4]}.. | Name: {res['name']} | Score: {score} | Matches: {matches}")

    scored_results.sort(key=lambda x: x['score'], reverse=True)
    top_5 = scored_results[:5]
    
    print("\n   === TOP 5 RAG RESULTS ===")
    for item in top_5:
        print(f"   Name: {item['doc']['name']}")
        print(f"   Category: {item['doc'].get('category')}")
        print(f"   Service Area: {item['doc'].get('contact_info', {}).get('service_area')}")
        programs = item['doc'].get('programs', [])
        prog_names = [p.get('name') for p in programs]
        print(f"   Programs: {prog_names}")
        print("   ---")

if __name__ == "__main__":
    debug_rag("I need help finding a computer class in Compton")
