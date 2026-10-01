import psycopg2

tests = [
    {"host": "dysirmubdnvyafotcrsc.supabase.co", "port": 5432, "user": "postgres"},
    {"host": "dysirmubdnvyafotcrsc.supabase.co", "port": 6543, "user": "postgres.dysirmubdnvyafotcrsc"},
    {"host": "aws-0-ap-south-1.pooler.supabase.com", "port": 6543, "user": "postgres.dysirmubdnvyafotcrsc"},
    {"host": "aws-0-ap-south-1.pooler.supabase.com", "port": 5432, "user": "postgres.dysirmubdnvyafotcrsc"},
    {"host": "aws-0-ap-southeast-1.pooler.supabase.com", "port": 6543, "user": "postgres.dysirmubdnvyafotcrsc"},
    {"host": "aws-0-us-east-1.pooler.supabase.com", "port": 6543, "user": "postgres.dysirmubdnvyafotcrsc"},
]

pwd = "Aevoryn@SIH"
dbname = "postgres"

for t in tests:
    h = t["host"]
    p = t["port"]
    u = t["user"]
    print(f"Testing {h}:{p} as {u}...", flush=True)
    try:
        conn = psycopg2.connect(
            host=h,
            port=p,
            user=u,
            password=pwd,
            dbname=dbname,
            sslmode="require",
            connect_timeout=3
        )
        print(f"!!! SUCCESS CONNECTED TO {h}:{p} as {u} !!!", flush=True)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        print("Version:", cursor.fetchone()[0], flush=True)
        conn.close()
        break
    except Exception as e:
        print(f"Failed {h}:{p} -> {e}", flush=True)
