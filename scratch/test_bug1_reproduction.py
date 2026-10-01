import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_flow():
    email = "test_approval_flow_user@nawi.gov.in"
    password = "TestUser@123"
    name = "Test Approval User"

    print("Step 1: Registering new user...")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "requested_role": "inspector",
        "lab_id": 1
    })
    print("Reg Status:", reg_resp.status_code, reg_resp.json())

    print("\nStep 2: Attempting login before approval...")
    login_before = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    print("Login Before Status:", login_before.status_code, login_before.json())

    print("\nStep 3: Logging in as Admin...")
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@nawi.gov.in",
        "password": "Admin@123"
    })
    admin_token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    print("\nStep 4: Getting pending users list...")
    pending_resp = requests.get(f"{BASE_URL}/users/pending", headers=headers)
    pending_users = pending_resp.json()
    print("Pending Users:", pending_users)

    target_user = next((u for u in pending_users if u["email"] == email), None)
    if not target_user:
        print("ERROR: Target user not found in pending list!")
        sys.exit(1)

    print(f"\nStep 5: Approving user ID {target_user['id']}...")
    approve_resp = requests.post(
        f"{BASE_URL}/users/{target_user['id']}/approve",
        headers=headers,
        json={"role": "inspector", "lab_id": 1}
    )
    print("Approve Status:", approve_resp.status_code, approve_resp.json())

    print("\nStep 6: Attempting login AFTER approval...")
    login_after = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    print("Login After Status:", login_after.status_code, login_after.json())

if __name__ == "__main__":
    test_flow()
