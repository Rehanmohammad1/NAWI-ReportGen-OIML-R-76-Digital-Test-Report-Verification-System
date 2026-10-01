import psycopg2

regions = [
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-sa-east-1.pooler.supabase.com"
]

user = "postgres.dysirmubdnvyafotcrsc"
pwd = "Aevoryn@SIH"
dbname = "postgres"

for host in regions:
    for port in [5432, 6543]:
        try:
            print(f"Testing {host}:{port}...", flush=True)
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=pwd,
                dbname=dbname,
                sslmode="require",
                connect_timeout=3
            )
            print(f"SUCCESSFULLY CONNECTED TO {host}:{port}!")
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            print("Server version:", cursor.fetchone()[0])
            conn.close()
            exit(0)
        except Exception as e:
            print(f"Error {host}:{port} -> {e}")
