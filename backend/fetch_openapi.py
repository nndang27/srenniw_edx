import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def fetch_schema():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    res = httpx.get(f"{url}/rest/v1/", headers={"apikey": key})
    
    data = res.json()
    paths = data.get("paths", {})
    
    # Check if there is an RPC for realtime or executing sql
    for path in paths:
        if path.startswith("/rpc/"):
            print("RPC available:", path)
            
    # Print definitions to see tables
    defs = data.get("definitions", {})
    print("Tables available:")
    for d in defs:
        print(" -", d)

if __name__ == "__main__":
    fetch_schema()
