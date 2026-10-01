import psycopg2

conn_str = "postgresql://postgres:Aevoryn%40SIH@db.dysirmubdnvyafotcrsc.supabase.co:5432/postgres?sslmode=require"

print("Attempting connection to Supabase host db.dysirmubdnvyafotcrsc.supabase.co:5432...")
try:
    conn = psycopg2.connect(conn_str, connect_timeout=15)
    print("SUCCESSFULLY CONNECTED!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone()[0])
    conn.close()
except Exception as e:
    print("Direct connection failed:", e)
