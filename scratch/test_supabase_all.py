import os
import sys
import socket
import urllib.request
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.getenv("SUPABASE_DB_URL")
print("1. Checking backend/.env SUPABASE_DB_URL...")
if "dysirmubdnvyafotcrsc" in (url or ""):
    print("  [OK] Points to project ref: dysirmubdnvyafotcrsc")
else:
    print("  [WARNING] URL does not contain project ref dysirmubdnvyafotcrsc:", url)

pwd = "Aevoryn@SIH"
dbname = "postgres"

# Test direct host
direct_host = "db.dysirmubdnvyafotcrsc.supabase.co"
print(f"\n2. Testing Direct Host {direct_host}:5432...")
try:
    conn = psycopg2.connect(
        host=direct_host,
        port=5432,
        user="postgres",
        password=pwd,
        dbname=dbname,
        sslmode="require",
        connect_timeout=5
    )
    print("  [SUCCESS] CONNECTED TO DIRECT HOST!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("  Version:", cur.fetchone()[0])
    conn.close()
    sys.exit(0)
except Exception as e:
    print("  [FAILED Direct Host]:", e)

# Test all Supabase Pooler Regions
regions = [
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-northeast-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-sa-east-1.pooler.supabase.com",
    "aws-0-ca-central-1.pooler.supabase.com",
    "aws-0-me-central-1.pooler.supabase.com"
]

user_tenant = "postgres.dysirmubdnvyafotcrsc"

print(f"\n3. Testing IPv4 Pooler Hosts as '{user_tenant}'...")
connected_pooler = False
for r in regions:
    for port in [6543, 5432]:
        try:
            conn = psycopg2.connect(
                host=r,
                port=port,
                user=user_tenant,
                password=pwd,
                dbname=dbname,
                sslmode="require",
                connect_timeout=3
            )
            print(f"  [SUCCESS] CONNECTED VIA POOLER {r}:{port}!")
            cur = conn.cursor()
            cur.execute("SELECT version();")
            print("  Version:", cur.fetchone()[0])
            conn.close()
            connected_pooler = True
            break
        except Exception as e:
            pass
    if connected_pooler:
        break

if not connected_pooler:
    print("  [FAIL] All TCP 5432/6543 pooler connections timed out.")

# Test HTTPS Port 443 REST API
print("\n4. Testing HTTPS Port 443 REST API Endpoint...")
rest_url = "https://dysirmubdnvyafotcrsc.supabase.co/rest/v1/"
try:
    req = urllib.request.Request(rest_url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        print("  HTTPS Status Code:", resp.status)
except urllib.error.HTTPError as e:
    print(f"  HTTPS Endpoint Responded (HTTP {e.code}): Supabase PostgREST Gateway Active over Port 443!")
except Exception as e:
    print("  HTTPS Error:", e)
