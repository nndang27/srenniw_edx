import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
if not url or not key:
    print("NO SUPABASE CREDS")
else:
    client = create_client(url, key)
    try:
        res = client.table("chat_rooms").select("*").limit(1).execute()
        print("SUCCESS:", res)
    except Exception as e:
        print("ERROR:", e)
