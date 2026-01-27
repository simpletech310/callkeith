
import os
import json
from dotenv import load_dotenv
from supabase import create_client

# Load Environment
load_dotenv('.env.local')
if not os.getenv("NEXT_PUBLIC_SUPABASE_URL"):
    load_dotenv('onward/.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Missing Service Role Key")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Real Data for 17 Organizations
REAL_DATA = [
    {
        "name": "Shields for Families",
        "category": "health",
        "secondary_categories": ["mental health", "childcare", "housing", "transportation"],
        "description": "SHIELDS for Families is a non-profit organization based in South Los Angeles that offers comprehensive social services to empower families. They focus on child and youth development, child welfare, mental health, substance abuse treatment, and domestic violence services.",
        "programs": [
            {"name": "Genesis Program", "description": "Substance abuse treatment for adult parenting women with children."},
            {"name": "Multidisciplinary Assessment Team (MAT)", "description": "Immediate assessments for children in the child welfare system to facilitate family reunification."},
            {"name": "Mental Health Services", "description": "Evidence-based therapy (TF-CBT, Seeking Safety) for adults, children, and youth."},
            {"name": "Vocational Training", "description": "Educational and vocational support to help families become self-sufficient."}
        ],
        "contact_info": {
            "website": "https://www.shieldsforfamilies.org",
            "service_area": "South Los Angeles, Compton",
            "phone": "323-242-5000"
        }
    },
    {
        "name": "A New Way of Life",
        "category": "housing",
        "secondary_categories": ["legal", "employment", "families"],
        "description": "A New Way of Life Reentry Project (ANWOL) provides housing, legal services, and leadership development for women rebuilding their lives after incarceration. They offer safe, sober living environments and support family reunification.",
        "programs": [
            {"name": "Safe Housing", "description": "Transitional and independent living for formerly incarcerated women."},
            {"name": "Pro Bono Legal Services", "description": "Assistance with expungement, occupational licenses, and rights restoration."},
            {"name": "Family Reunification", "description": "Support for mothers to reunite with their children and rebuild family bonds."},
            {"name": "Women Organizing for Justice", "description": "Leadership training to empower formerly incarcerated women as advocates."}
        ],
        "contact_info": {
            "website": "https://anewwayoflife.org",
            "service_area": "Los Angeles County",
            "phone": "323-563-3575"
        }
    },
    {
        "name": "Covenant House CA",
        "category": "housing",
        "secondary_categories": ["health", "education", "employment"],
        "description": "Covenant House California (CHC) is a youth shelter providing sanctuary and support for homeless and trafficked youth aged 18-24. They offer a full continuum of care including shelter, medical care, and education.",
        "programs": [
            {"name": "Safe Haven Shelter", "description": "Immediate shelter, food, and medical care for youth experiencing homelessness."},
            {"name": "Rights of Passage", "description": "Transitional housing program helping youth move toward independence."},
            {"name": "Supportive Apartments", "description": "Long-term housing support for young adults."},
            {"name": "Internships & Job Readiness", "description": "On-site and off-site job training and internship placements."}
        ],
        "contact_info": {
            "website": "https://covenanthousecalifornia.org",
            "service_area": "Los Angeles (Hollywood), Oakland",
            "phone": "323-461-3131"
        }
    },
    {
        "name": "WomenShelter of Long Beach",
        "category": "housing",
        "secondary_categories": ["legal", "mental health", "childcare"],
        "description": "WomenShelter of Long Beach (WSLB) assists victims of domestic violence and their children through emergency shelter, counseling, and supportive services. They welcome all victims regardless of gender or age.",
        "programs": [
            {"name": "Emergency Supportive Housing", "description": "Confidential emergency shelter for domestic violence victims and their children."},
            {"name": "24-Hour Crisis Hotline", "description": "Immediate support, safety planning, and referrals."},
            {"name": "Domestic Violence Resource Center", "description": "Walk-in services including crisis management and support groups."},
            {"name": "Youth Services", "description": "Counseling and support groups for children and teens affected by violence."}
        ],
        "contact_info": {
            "website": "https://womenshelterlb.org",
            "service_area": "Long Beach, Greater Los Angeles",
            "phone": "562-437-4663"
        }
    },
    {
        "name": "Project Shepherd",
        "category": "food",
        "secondary_categories": ["financial", "families"],
        "description": "Project Shepherd is a non-profit assisted by the City of Lakewood, assisting residents in need with food, utility payments, and seasonal programs like holiday toy drives.",
        "programs": [
            {"name": "Emergency Food Pantry", "description": "Year-round distribution of canned goods and essential items."},
            {"name": "Utility Bill Assistance", "description": "One-time financial aid for utility payments for Lakewood residents."},
            {"name": "Teddy Bear Tree", "description": "Holiday program providing toys and gifts for children."},
            {"name": "Backpack Program", "description": "Annual distribution of school supplies and backpacks."}
        ],
        "contact_info": {
            "website": "https://www.lakewoodca.gov/About/Charitable-Organizations",
            "service_area": "Lakewood Residents",
            "phone": "562-925-3712"
        }
    },
    {
        "name": "The Salvation Army Compton",
        "category": "food",
        "secondary_categories": ["housing", "utilities", "youth"],
        "description": "The Salvation Army Compton Corps provides comprehensive services to combat poverty, including food pantries, utility assistance, and youth programs, serving the Compton community.",
        "programs": [
            {"name": "Food Pantry", "description": "Weekly food distribution and emergency meal assistance."},
            {"name": "Utility Assistance", "description": "Help with electric and other utility bills (by appointment)."},
            {"name": "Youth Programs", "description": "After-school programs, sports (basketball), and music lessons."},
            {"name": "Love Kitchen", "description": "Free hot meals served to the community."}
        ],
        "contact_info": {
            "website": "https://compton.salvationarmy.org",
            "service_area": "Compton",
            "phone": "310-639-0362"
        }
    },
    {
        "name": "Long Beach Community Table",
        "category": "food",
        "secondary_categories": ["health", "education"],
        "description": "Long Beach Community Table (LBCT) is a mutual-aid non-profit distributing fresh food, hygiene items, and clothing. They also build urban gardens to promote sustainability.",
        "programs": [
            {"name": "Weekend Food Distribution", "description": "Free fresh produce and groceries distributed weekly."},
            {"name": "Homebound Delivery", "description": "Grocery delivery for seniors and those unable to leave home."},
            {"name": "Urban Gardens", "description": "Building and maintaining gardens to teach food self-sufficiency."},
            {"name": "Hygiene & Clothing", "description": "Distribution of essential personal care items and clothes."}
        ],
        "contact_info": {
            "website": "https://longbeachcommunitytable.com",
            "service_area": "Long Beach",
            "phone": "562-548-0774"
        }
    },
    {
        "name": "Broken Loaf Pantry",
        "category": "food",
        "secondary_categories": ["families"],
        "description": "Affiliated with Lakewood First United Methodist Church, Broken Loaf Pantry provides food assistance to community members on specific Saturdays each month.",
        "programs": [
            {"name": "Bi-Monthly Food Pantry", "description": "Food distribution on the 2nd and 4th Saturday of each month (9am-11am)."},
            {"name": "Emergency Supplies", "description": "Distribution of groceries to those in immediate need."}
        ],
        "contact_info": {
            "website": "https://brokenloaf.com",
            "service_area": "Lakewood, Long Beach",
            "address": "4300 Bellflower Blvd, Lakewood, CA 90713"
        }
    },
    {
        "name": "Meals on Wheels LB",
        "category": "food",
        "secondary_categories": ["health", "seniors"],
        "description": "Meals on Wheels of Long Beach delivers nutritionally balanced meals to homebound individuals, seniors, and veterans, ensuring they can live independently and healthily.",
        "programs": [
            {"name": "Home Delivered Meals", "description": "Daily delivery of a hot dinner and cold lunch for homebound clients."},
            {"name": "Friendly Visits", "description": "Wellness checks and social interaction provided by volunteers during delivery."},
            {"name": "Nutritional Counseling", "description": "Dietary support to ensure client health needs are met."},
            {"name": "Subsidized Meals", "description": "Financial assistance for low-income clients."}
        ],
        "contact_info": {
            "website": "https://mowlb.org",
            "service_area": "Long Beach, Signal Hill, Lakewood",
            "phone": "562-439-5000"
        }
    },
    {
        "name": "Un Mundo de Amigos",
        "category": "education",
        "secondary_categories": ["childcare", "families"],
        "description": "Un Mundo de Amigos is a preschool providing high-quality, free, or low-cost early childhood education to underserved children in Long Beach, using a child-centered approach.",
        "programs": [
            {"name": "Preschool Program", "description": "Full-day and part-day early education for children ages 2-5."},
            {"name": "Family Support Services", "description": "Referrals for food, legal aid, and mental health services for families."},
            {"name": "Nutrition Program", "description": "Daily breakfasts, lunches, and snacks meeting USDA guidelines."},
            {"name": "Parent Workshops", "description": "Monthly workshops on parenting and child development."}
        ],
        "contact_info": {
            "website": "https://unmundodeamigos.org",
            "service_area": "Long Beach",
            "phone": "562-436-4124"
        }
    },
    {
        "name": "Children’s Home Society",
        "category": "childcare",
        "secondary_categories": ["education", "resources"],
        "description": "Children’s Home Society of California (CHS) provides child care resources, subsidized payment programs, and educational materials to support families and child care providers.",
        "programs": [
            {"name": "Resource and Referral", "description": "Assistance finding licensed child care that meets family needs."},
            {"name": "Child Care Payment Program", "description": "Subsidized child care for eligible low-income families (CalWORKs, APP)."},
            {"name": "Family Child Care Education", "description": "Training and technical support for family child care providers."},
            {"name": "Lending Library", "description": "Free access to educational toys and parenting resources."}
        ],
        "contact_info": {
            "website": "https://chs-ca.org",
            "service_area": "Long Beach, Greater California",
            "phone": "562-256-7400"
        }
    },
    {
        "name": "The 10-20 Club",
        "category": "education",
        "secondary_categories": ["mental health", "youth"],
        "description": "The 10-20 Club provides mentoring, skill-building, and mental wellness programs for at-risk youth ages 10-20 to help them reach their full potential.",
        "programs": [
            {"name": "Youth Mentoring", "description": "One-on-one and group mentoring to build positive relationships."},
            {"name": "Skill Building Workshops", "description": "Life skills training for decision making and future success."},
            {"name": "Mental Wellness Support", "description": "Programs focused on emotional health and coping strategies."}
        ],
        "contact_info": {
            "website": "https://1020club.org",
            "service_area": "Long Beach, Los Angeles County",
            "phone": "See Website"
        }
    },
    {
        "name": "For The Child",
        "category": "mental health",
        "secondary_categories": ["families", "legal"],
        "description": "For The Child builds healthy lives for children and families through abuse prevention, trauma-informed therapy, and advocacy. They specialize in healing from abuse and neglect.",
        "programs": [
            {"name": "Child Abuse Response Team", "description": "24/7 immediate response and support for abuse cases."},
            {"name": "Trauma Recovery Therapy", "description": "Specialized specialized therapy for victims of crime and abuse."},
            {"name": "Family Strengthening", "description": "Parent education and support to prevent abuse and neglect."},
            {"name": "Mental Health Services", "description": "Comprehensive assessments and counseling for children and families."}
        ],
        "contact_info": {
            "website": "https://forthechild.org",
            "service_area": "Long Beach",
            "phone": "562-427-7671"
        }
    },
    {
        "name": "NAMI Greater LA",
        "category": "mental health",
        "secondary_categories": ["education", "families"],
        "description": "NAMI Greater Los Angeles County provides support, education, and advocacy for individuals and families affected by mental illness, striving to end stigma and improve care.",
        "programs": [
            {"name": "Support Groups", "description": "Peer-led groups for individuals (Connection) and families (Family Support)."},
            {"name": "Family-to-Family", "description": "Educational course for families of individuals with mental health conditions."},
            {"name": "Warmline (Connect with HOPE)", "description": "Non-crisis emotional support and resource navigation."},
            {"name": "Peer-to-Peer", "description": "Recovery education classes for adults with mental health conditions."}
        ],
        "contact_info": {
            "website": "https://namiglac.org",
            "service_area": "Los Angeles County",
            "phone": "213-386-3615"
        }
    },
    {
        "name": "Helpline Youth Counseling",
        "category": "mental health",
        "secondary_categories": ["housing", "youth", "substance_abuse"],
        "description": "Helpline Youth Counseling (HYC) serves at-risk youth and families with trauma-informed behavioral health, substance use treatment, and housing support services.",
        "programs": [
            {"name": "Youth Substance Use Treatment", "description": "Counseling and case management for youth (Starting Point program)."},
            {"name": "Homeless & Housing Support", "description": "Housing navigation, rental assistance, and eviction prevention."},
            {"name": "Family Services", "description": "Counseling and education to reduce domestic violence and strengthen families."},
            {"name": "Gang Prevention", "description": "Intervention services to support youth and discourage gang involvement."}
        ],
        "contact_info": {
            "website": "https://hycinc.org",
            "service_area": "Southeast LA County, Long Beach",
            "phone": "562-273-0722"
        }
    },
    {
        "name": "Su Casa",
        "category": "housing",
        "secondary_categories": ["legal", "families"],
        "description": "Su Casa - Ending Domestic Violence empowers survivors with emergency shelter, transitional housing, and comprehensive support services to live free from abuse.",
        "programs": [
            {"name": "Emergency Shelter", "description": "Safe, confidential shelter for survivors and children (up to 30 days)."},
            {"name": "Transitional Housing", "description": "Longer-term housing (3-12 months) with support for independence."},
            {"name": "24-Hour Hotline", "description": "Crisis support and information for domestic violence victims."},
            {"name": "Community Outreach", "description": "Education and advocacy to prevent domestic violence."}
        ],
        "contact_info": {
            "website": "https://sucasadv.org",
            "service_area": "Long Beach, Los Angeles",
            "phone": "562-402-4888"
        }
    },
    {
        "name": "Optimist Youth Homes",
        "category": "mental health",
        "secondary_categories": ["housing", "foster_care", "youth"],
        "description": "Optimist Youth Homes and Family Services provides specialized treatment, education, and residential care for at-risk youth, foster children, and probation youth.",
        "programs": [
            {"name": "Residential Care (STRTP)", "description": "24-hour therapeutic residential care for youth."},
            {"name": "Foster Family Agency", "description": "Placement and support for children in foster care."},
            {"name": "Mental Health Services", "description": "Therapy, Wrap-Around, and psychiatric services for youth."},
            {"name": "Transitional Housing", "description": "Housing and support for youth aging out of the foster care system."}
        ],
        "contact_info": {
            "website": "https://oyhfs.org",
            "service_area": "Los Angeles County",
            "phone": "323-443-3100"
        }
    }
]

def update_organizations():
    print(f"🚀 Starting Update for {len(REAL_DATA)} Organizations...")
    
    updated_count = 0
    
    for org in REAL_DATA:
        try:
            # 1. Find the org by name (Simple ILIKE)
            # We assume unique names for this dataset
            name_query = org['name']
            
            # Use 'ilike' to be forgiving
            res = supabase.table('resources').select('id').ilike('name', name_query).execute()
            
            if not res.data:
                print(f"⚠️ Could not find: {name_query} - Attempting INSERT...")
                # Insert Logic
                new_org = {
                    "name": org['name'], # Use the correct clean name
                    "category": org['category'],
                    # secondary_categories is array text[] in schema? or text? 
                    # Schema says: suitability_tags text[], 
                    # wait, schema.sql showed: secondary_categories isn't in top level schema!
                    # Ah, verifying schema first might be wise. 
                    # But wait, we just updated 15 records successfully with 'secondary_categories'. 
                    # So the column exists (likely added in migration).
                    "secondary_categories": org['secondary_categories'],
                    "description": org['description'],
                    "programs": org['programs'],
                    "contact_info": org['contact_info'],
                    "suitability_tags": ["General"] # Default
                }
                
                try:
                    insert_res = supabase.table('resources').insert(new_org).execute()
                    print(f"   ✅ Inserted: {org['name']}")
                    updated_count += 1
                except Exception as insert_err:
                    print(f"   ❌ Insert Failed: {insert_err}")
                
                continue
                
            # If multiple found, update all? Or just first? 
            # Logic: Update all matches to be consistent.
            ids_to_update = [r['id'] for r in res.data]
            
            payload = {
                "category": org['category'],
                "secondary_categories": org['secondary_categories'],
                "description": org['description'],
                "programs": org['programs'],
                "contact_info": org['contact_info']
                # We do NOT overwrite location/owner_id unless we want to reset them
            }
            
            for rid in ids_to_update:
                supabase.table('resources').update(payload).eq('id', rid).execute()
                print(f"✅ Updated: {org['name']} (ID: {rid})")
                updated_count += 1
                
        except Exception as e:
            print(f"❌ Error updating {org['name']}: {e}")

    print(f"\n🎉 Update Complete. Total records modified: {updated_count}")
    
if __name__ == "__main__":
    update_organizations()
