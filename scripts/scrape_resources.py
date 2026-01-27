
import os
import requests
from bs4 import BeautifulSoup
import json
from supabase import create_client, Client

# PRE-DEFINED TARGET LIST
TARGETS = [
  {"org": "Shields for Families", "url": "https://www.shieldsforfamilies.org"},
  {"org": "A New Way of Life", "url": "https://anewwayoflife.org"},
  {"org": "Covenant House CA", "url": "https://covenanthousecalifornia.org"},
  {"org": "WomenShelter of Long Beach", "url": "https://womenshelterlb.org"},
  {"org": "Project Shepherd", "url": "https://www.lakewoodca.gov/About/Charitable-Organizations"},
  {"org": "The Salvation Army Compton", "url": "https://compton.salvationarmy.org"},
  {"org": "Long Beach Community Table", "url": "https://longbeachcommunitytable.com"},
  {"org": "Broken Loaf Pantry", "url": "https://brokenloaf.com"},
  {"org": "Meals on Wheels LB", "url": "https://mowlb.org"},
  {"org": "Un Mundo de Amigos", "url": "https://unmundodeamigos.org"},
  {"org": "Children’s Home Society", "url": "https://chs-ca.org"},
  {"org": "The 10-20 Club", "url": "https://1020club.org"},
  {"org": "For The Child", "url": "https://forthechild.org"},
  {"org": "NAMI Greater LA", "url": "https://namiglac.org"},
  {"org": "Helpline Youth Counseling", "url": "https://hycinc.org"},
  {"org": "Su Casa", "url": "https://sucasadv.org"},
  {"org": "Optimist Youth Homes", "url": "https://oyhfs.org"}
]

# Env vars
SUPABASE_URL = "https://bodluorbjqrxskdlvsbb.supabase.co"
# USER NOTE: Please update this with the SERVICE ROLE KEY if RLS blocks the Anon Key
# For now, using the anon key but user needs to update policy OR provide service role
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZGx1b3JianFyeHNrZGx2c2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0ODUyNiwiZXhwIjoyMDg1MDI0NTI2fQ.vEokv42lJKaMjZiS7vxlvuGXrE01jUJOvOn7h3gmLfo"


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_site(url):
    try:
        headers = {'User-Agent': 'OnwardMissionsBot/1.0'}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)[:5000] 
            return text
        else:
            return None
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def main():
    print("🤖 AGENT DELTA: Starting Ingestion Mission...")
    
    for target in TARGETS:
        print(f"Processing: {target['org']}...")
        raw_text = scrape_site(target['url'])
        
        if raw_text:
            summary = {
                "name": target['org'],
                "category": "General Aid",
                "description": raw_text[:200] + "...", 
                "contact_info": {"url": target['url']},
                "suitability_tags": ["General"]
            }
            
            # Using 768-dim vector
            embedding = [0.0] * 768 
            
            data = {
                "name": summary['name'],
                "category": summary['category'],
                "description": summary["description"],
                "contact_info": summary["contact_info"],
                "suitability_tags": summary["suitability_tags"],
                "embedding": embedding
            }
            
            try:
                # Upsert causes fewer conflicts if run multiple times
                supabase.table("resources").insert(data).execute()
                print(f"✅ Ingested: {target['org']}")
            except Exception as e:
                print(f"❌ DB Error for {target['org']}: {e}")
        else:
            print(f"⚠️ Failed to scrape: {target['org']}")

if __name__ == "__main__":
    main()
