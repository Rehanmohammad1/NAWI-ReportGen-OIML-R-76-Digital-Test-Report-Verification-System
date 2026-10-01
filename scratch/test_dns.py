import urllib.request
import json

def dns_query_aaaa(domain):
    url = f"https://dns.google/resolve?name={domain}&type=AAAA"
    req = urllib.request.Request(url, headers={"User-Agent": "Python-DNS"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"--- AAAA DNS Result for {domain} ---")
        print(json.dumps(data, indent=2))

dns_query_aaaa("db.dysirmubdnvyafotcrsc.supabase.co")
