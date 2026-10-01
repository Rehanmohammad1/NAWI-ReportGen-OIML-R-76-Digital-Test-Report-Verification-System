import psycopg2

hosts = [
    # Direct IP addresses for aws-0-ap-south-1.pooler.supabase.com
    {"ip": "65.0.195.55", "name": "ap-south-1 (Mumbai)"},
    {"ip": "3.111.105.85", "name": "ap-south-1 (Mumbai)"},
]

# Common Supabase pooler regions
pooler_hosts = [
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com"
]

user = "postgres.dysirmubdnvyafotcrsc"
pwd = "Aevoryn@SIH"
dbname = "postgres"

print("--- TESTING DIRECT SUPABASE CONNECTION ---")

connected = False

# 1. Test Direct Host with IPv6 or Hostname
for h in ["db.dysirmubdnvyafotcrsc.supabase.co", "dysirmubdnvyafotcrsc.supabase.co"] + pooler_hosts:
    for port in [6543, 5432]:
        u = "postgres" if "db." in h else user
        try:
            print(f"Trying {h}:{port} as user '{u}'...")
            conn = psycopg2.connect(
                host=h,
                port=port,
                user=u,
                password=pwd,
                dbname=dbname,
                sslmode="require",
                connect_timeout=4
            )
            print(f"\n=======================================================")
            print(f"SUCCESS! CONNECTED TO {h}:{port} as user '{u}'")
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            print("PostgreSQL Version:", cursor.fetchone()[0])
            print(f"=======================================================\n")
            conn.close()
            connected = True
            break
        except Exception as e:
            print(f"  -> Error ({h}:{port}): {e}")
    if connected:
        break
