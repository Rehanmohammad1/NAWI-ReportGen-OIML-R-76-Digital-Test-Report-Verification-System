import socket
import psycopg2

ipv6_addr = "2406:da18:167b:f900:87ea:9bdd:7b65:d1e4"
port = 5432
pwd = "Aevoryn@SIH"

print(f"Testing raw IPv6 socket connection to [{ipv6_addr}]:{port}...")

try:
    s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((ipv6_addr, port))
    print("IPv6 SOCKET CONNECT SUCCESS!")
    s.close()
    
    # Test psycopg2 with hostaddr
    conn = psycopg2.connect(
        hostaddr=ipv6_addr,
        port=port,
        user="postgres",
        password=pwd,
        dbname="postgres",
        sslmode="require",
        connect_timeout=5
    )
    print("PSYCOPG2 IPv6 CONNECTION SUCCESS!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone()[0])
    conn.close()
except Exception as e:
    print("IPv6 Socket/Psycopg2 error:", e)
