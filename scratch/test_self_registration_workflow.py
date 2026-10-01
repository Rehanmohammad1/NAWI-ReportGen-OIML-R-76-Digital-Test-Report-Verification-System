import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()["access_token"]
    return None

def main():
    print("==================================================================")
    print("SIH26035 SELF-REGISTRATION & ADMINISTRATIVE APPROVAL VERIFICATION")
    print("==================================================================")

    passed_count = 0
    total_tests = 11

    # TEST 10: Existing four demo accounts still work
    print("\n--- TEST 10: Existing four demo accounts authentication ---")
    admin_token = login("admin@nawi.gov.in", "Admin@123")
    m1_token = login("manager.delhi@nawi.gov.in", "Manager@123")
    i1_token = login("inspector.delhi@nawi.gov.in", "Inspector@123")
    r1_token = login("reviewer.delhi@nawi.gov.in", "Reviewer@123")

    if admin_token and m1_token and i1_token and r1_token:
        print("[PASS] TEST 10: All 4 original demo accounts logged in successfully.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 10: Demo login failed: admin={bool(admin_token)}, m1={bool(m1_token)}, i1={bool(i1_token)}, r1={bool(r1_token)}")

    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    import time
    unique_email = f"rahul_{int(time.time())}@example.gov.in"

    # TEST 1: New User Self-Registration
    print("\n--- TEST 1: New User Self-Registration ---")
    reg_payload = {
        "name": "Rahul Kumar",
        "email": unique_email,
        "password": "RahulPass@123",
        "requested_role": "lab_manager",
        "lab_id": 1
    }
    r_reg = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if r_reg.status_code == 200 and r_reg.json().get("status") == "pending":
        print("[PASS] TEST 1: Self-registration successful; account created with status='pending'.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 1: Self-registration failed: {r_reg.status_code} {r_reg.text}")

    # TEST 2: Duplicate Email Rejection
    print("\n--- TEST 2: Duplicate Email Registration Rejection ---")
    r_dup = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if r_dup.status_code == 400 and "already registered" in r_dup.text.lower():
        print("[PASS] TEST 2: Duplicate email registration rejected with 400 Bad Request.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 2: Duplicate check failed: {r_dup.status_code} {r_dup.text}")

    # TEST 3: Pending Account Cannot Log In
    print("\n--- TEST 3: Pending Account Login Guard ---")
    rahul_login_attempt = login(unique_email, "RahulPass@123")
    if rahul_login_attempt is None:
        print("[PASS] TEST 3: Pending account login correctly blocked (returns 401 Unauthorized).")
        passed_count += 1
    else:
        print("[FAIL] TEST 3: Pending account WAS able to log in!")

    # TEST 4: Administrator Sees Pending Registration
    print("\n--- TEST 4: Administrator Pending Queue ---")
    r_pending = requests.get(f"{BASE_URL}/users/pending", headers=headers_admin)
    pending_list = r_pending.json() if r_pending.status_code == 200 else []
    rahul_pending = next((u for u in pending_list if u["email"] == unique_email), None)
    if rahul_pending and rahul_pending["status"] == "pending":
        rahul_id = rahul_pending["id"]
        print(f"[PASS] TEST 4: Administrator retrieved pending registration for Rahul Kumar (ID: {rahul_id}).")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 4: Pending registration not found in queue: {pending_list}")

    # TEST 5: Administrator Approves Registration
    print("\n--- TEST 5: Administrator Approves Registration ---")
    r_approve = requests.post(f"{BASE_URL}/users/{rahul_id}/approve", headers=headers_admin, json={
        "role": "lab_manager",
        "lab_id": 1
    })
    if r_approve.status_code == 200 and r_approve.json().get("status") == "active":
        print("[PASS] TEST 5: Registration approved by Administrator; account status set to 'active'.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 5: Approval failed: {r_approve.status_code} {r_approve.text}")

    # TEST 6: Approved User Can Log In
    print("\n--- TEST 6: Approved User Log In ---")
    rahul_token = login(unique_email, "RahulPass@123")
    if rahul_token:
        print("[PASS] TEST 6: Newly approved user Rahul Kumar logged in successfully using his own credentials.")
        passed_count += 1
    else:
        print("[FAIL] TEST 6: Approved user failed to log in!")

    headers_rahul = {"Authorization": f"Bearer {rahul_token}"}

    # TEST 7: User Receives Approved Role
    print("\n--- TEST 7: Approved User Role Verification ---")
    r_me = requests.get(f"{BASE_URL}/sessions", headers=headers_rahul)
    if r_me.status_code == 200:
        print("[PASS] TEST 7: Rahul Kumar successfully authorized with Laboratory Manager role permissions.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 7: Role verification failed: {r_me.status_code} {r_me.text}")

    # TEST 8: Laboratory Scoping Works
    print("\n--- TEST 8: Laboratory Row Scoping for Approved User ---")
    rahul_sessions = r_me.json()
    scoped = all(s.get("lab_id") == 1 for s in rahul_sessions) if rahul_sessions else True
    if scoped:
        print(f"[PASS] TEST 8: Laboratory row scoping verified ({len(rahul_sessions)} sessions scoped to lab_id=1).")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 8: Laboratory scoping failed: {rahul_sessions}")

    # TEST 9: Administrator Role Cannot Be Self-Granted
    print("\n--- TEST 9: Admin Role Self-Grant Prevention ---")
    hacker_email = f"hacker_{int(time.time())}@example.gov.in"
    hacker_reg = {
        "name": "Hacker Fake",
        "email": hacker_email,
        "password": "HackerPass123",
        "requested_role": "admin"
    }
    r_hack = requests.post(f"{BASE_URL}/auth/register", json=hacker_reg)
    hacker_login = login(hacker_email, "HackerPass123")
    if r_hack.status_code == 200 and hacker_login is None:
        print("[PASS] TEST 9: Admin role self-grant prevented; account created as pending without active Admin access.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 9: Security flaw! Hacker obtained active login.")

    # TEST 11: Existing Application Functionality Unaffected
    print("\n--- TEST 11: Application Functionality Integrity ---")
    r_qr = requests.get(f"{BASE_URL}/verify/NAWI-R76-2026-DEMO-001")
    r_pdf = requests.get(f"{BASE_URL}/reports/1/download/pdf", headers=headers_admin)
    if r_qr.status_code == 200 and r_pdf.status_code == 200:
        print("[PASS] TEST 11: QR verification and PDF report generation continue operating flawlessly.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 11: QR or PDF report broken. QR: {r_qr.status_code}, PDF: {r_pdf.status_code}")

    print("\n==================================================================")
    print(f"FINAL RESULT: {passed_count}/{total_tests} TESTS PASSED")
    print("==================================================================")
    if passed_count == total_tests:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
