import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def enable_realtime():
    db_url = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # In Supabase, the publication is usually named `supabase_realtime`
        cur.execute("ALTER PUBLICATION supabase_realtime ADD TABLE notifications;")
        conn.commit()
        
        cur.close()
        conn.close()
        print("Successfully enabled real-time propagation for notifications table")
    except Exception as e:
        print(f"Error executing DB update: {e}")

if __name__ == "__main__":
    enable_realtime()
