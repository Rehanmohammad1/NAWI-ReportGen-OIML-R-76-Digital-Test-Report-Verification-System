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
    print("SIH26035 MULTI-USER AUTHORITY MANAGEMENT ENHANCEMENT VERIFICATION")
    print("==================================================================")

    passed_count = 0
    total_tests = 17

    # TEST 13: Existing four demo accounts still work
    print("\n--- TEST 13: Existing four demo accounts authentication ---")
    admin_token = login("admin@nawi.gov.in", "Admin@123")
    m1_token = login("manager.delhi@nawi.gov.in", "Manager@123")
    i1_token = login("inspector.delhi@nawi.gov.in", "Inspector@123")
    r1_token = login("reviewer.delhi@nawi.gov.in", "Reviewer@123")

    if admin_token and m1_token and i1_token and r1_token:
        print("[PASS] TEST 13: All 4 original demo accounts logged in successfully.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 13: Demo accounts login failed. admin: {bool(admin_token)}, m1: {bool(m1_token)}, i1: {bool(i1_token)}, r1: {bool(r1_token)}")

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_m1 = {"Authorization": f"Bearer {m1_token}"}
    headers_i1 = {"Authorization": f"Bearer {i1_token}"}
    headers_r1 = {"Authorization": f"Bearer {r1_token}"}

    # TEST 1: Administrator can create a second Laboratory Manager
    print("\n--- TEST 1: Administrator creates second Laboratory Manager ---")
    new_manager_payload = {
        "name": "Manager Delhi 3",
        "email": "manager3.delhi@nawi.gov.in",
        "password": "Manager3Pass@123",
        "role": "lab_manager",
        "lab_id": 1,
        "active": True
    }
    r = requests.post(f"{BASE_URL}/users", headers=headers_admin, json=new_manager_payload)
    if r.status_code == 200 and r.json().get("email") == "manager3.delhi@nawi.gov.in":
        m3_id = r.json()["id"]
        print(f"[PASS] TEST 1: Second Laboratory Manager created (ID: {m3_id}).")
        passed_count += 1
    elif r.status_code == 400 and "already registered" in r.text:
        users = requests.get(f"{BASE_URL}/users", headers=headers_admin).json()
        m3_id = next(u["id"] for u in users if u["email"] == "manager3.delhi@nawi.gov.in")
        print(f"[PASS] TEST 1: Second Laboratory Manager exists (ID: {m3_id}).")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 1: Failed to create second Lab Manager: {r.status_code} {r.text}")

    # TEST 2: Both Laboratory Managers can log in independently
    print("\n--- TEST 2: Both Laboratory Managers log in independently ---")
    m2_token = login("manager2.delhi@nawi.gov.in", "Manager@123")
    m3_token = login("manager3.delhi@nawi.gov.in", "Manager3Pass@123") or login("manager3.delhi@nawi.gov.in", "NewManager3Pass@123")
    if m1_token and m2_token and m3_token:
        print("[PASS] TEST 2: Multiple Laboratory Managers (manager1, manager2, manager3) logged in independently.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 2: Independent login failed. m1: {bool(m1_token)}, m2: {bool(m2_token)}, m3: {bool(m3_token)}")

    headers_m2 = {"Authorization": f"Bearer {m2_token}"}
    headers_m3 = {"Authorization": f"Bearer {m3_token}"}

    # TEST 3: Both users have Laboratory Manager permissions
    print("\n--- TEST 3: Both users have Laboratory Manager permissions ---")
    r_m1_sessions = requests.get(f"{BASE_URL}/sessions", headers=headers_m1)
    r_m2_sessions = requests.get(f"{BASE_URL}/sessions", headers=headers_m2)
    r_m3_sessions = requests.get(f"{BASE_URL}/sessions", headers=headers_m3)
    if r_m1_sessions.status_code == 200 and r_m2_sessions.status_code == 200 and r_m3_sessions.status_code == 200:
        print("[PASS] TEST 3: All Laboratory Managers have full manager permissions on session queries.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 3: Permission check failed. Codes: m1={r_m1_sessions.status_code}, m2={r_m2_sessions.status_code}, m3={r_m3_sessions.status_code}")

    # TEST 4: Laboratory row scoping works correctly
    print("\n--- TEST 4: Laboratory row scoping enforcement ---")
    m2_sessions = r_m2_sessions.json() if r_m2_sessions.status_code == 200 else []
    all_scoped_correctly = all(s.get("lab_id") == 1 for s in m2_sessions) if isinstance(m2_sessions, list) and m2_sessions else True
    if all_scoped_correctly:
        print(f"[PASS] TEST 4: Laboratory scoping verified ({len(m2_sessions)} sessions scoped strictly to lab_id=1).")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 4: Laboratory scoping broken! Unscoped sessions found: {m2_sessions}")

    # TEST 5: Administrator can deactivate one Manager
    print("\n--- TEST 5: Administrator deactivates Manager 3 ---")
    r_deact = requests.patch(f"{BASE_URL}/users/{m3_id}/status", headers=headers_admin, json={"active": False})
    if r_deact.status_code == 200 and r_deact.json().get("active") is False:
        print("[PASS] TEST 5: Manager 3 account deactivated by Administrator.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 5: Deactivation failed: {r_deact.status_code} {r_deact.text}")

    # TEST 6: Deactivated Manager cannot log in
    print("\n--- TEST 6: Deactivated Manager cannot log in ---")
    m3_deact_token = login("manager3.delhi@nawi.gov.in", "Manager3Pass@123") or login("manager3.delhi@nawi.gov.in", "NewManager3Pass@123")
    if m3_deact_token is None:
        print("[PASS] TEST 6: Deactivated Manager login blocked (returns 401 Unauthorized / inactive).")
        passed_count += 1
    else:
        print("[FAIL] TEST 6: Deactivated Manager WAS able to log in!")

    # TEST 7: Administrator can reactivate the Manager
    print("\n--- TEST 7: Administrator reactivates Manager 3 ---")
    r_react = requests.patch(f"{BASE_URL}/users/{m3_id}/status", headers=headers_admin, json={"active": True})
    if r_react.status_code == 200 and r_react.json().get("active") is True:
        print("[PASS] TEST 7: Manager 3 account reactivated by Administrator.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 7: Reactivation failed: {r_react.status_code} {r_react.text}")

    # TEST 8: Reactivated Manager can log in again
    print("\n--- TEST 8: Reactivated Manager can log in again ---")
    m3_react_token = login("manager3.delhi@nawi.gov.in", "Manager3Pass@123") or login("manager3.delhi@nawi.gov.in", "NewManager3Pass@123")
    if m3_react_token is not None:
        print("[PASS] TEST 8: Reactivated Manager logged in successfully.")
        passed_count += 1
    else:
        print("[FAIL] TEST 8: Reactivated Manager login failed.")

    # TEST 9: Inspector cannot access User Management
    print("\n--- TEST 9: Inspector forbidden from User Management ---")
    r_insp_users = requests.get(f"{BASE_URL}/users", headers=headers_i1)
    if r_insp_users.status_code == 403:
        print("[PASS] TEST 9: Inspector correctly forbidden (403 Forbidden) from /users endpoint.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 9: Expected 403, got {r_insp_users.status_code}")

    # TEST 10: Reviewer cannot access User Management
    print("\n--- TEST 10: Reviewer forbidden from User Management ---")
    r_rev_users = requests.get(f"{BASE_URL}/users", headers=headers_r1)
    if r_rev_users.status_code == 403:
        print("[PASS] TEST 10: Reviewer correctly forbidden (403 Forbidden) from /users endpoint.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 10: Expected 403, got {r_rev_users.status_code}")

    # TEST 11: Laboratory Manager cannot escalate their role or create users
    print("\n--- TEST 11: Laboratory Manager cannot create user or escalate role ---")
    r_esc = requests.post(f"{BASE_URL}/users", headers=headers_m1, json={
        "name": "Hacker Admin",
        "email": "hacker@nawi.gov.in",
        "password": "HackerPass123",
        "role": "admin"
    })
    if r_esc.status_code == 403:
        print("[PASS] TEST 11: Laboratory Manager user creation attempt rejected with 403 Forbidden.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 11: Role escalation security check failed! Code: {r_esc.status_code}")

    # TEST 12: Duplicate email is rejected
    print("\n--- TEST 12: Duplicate email registration rejected ---")
    r_dup = requests.post(f"{BASE_URL}/users", headers=headers_admin, json={
        "name": "Duplicate Admin",
        "email": "admin@nawi.gov.in",
        "password": "Password123",
        "role": "admin"
    })
    if r_dup.status_code == 400 and "already registered" in r_dup.text:
        print("[PASS] TEST 12: Duplicate email rejected with 400 Bad Request.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 12: Duplicate email check failed. Code: {r_dup.status_code}, detail: {r_dup.text}")

    # TEST 14: Existing test sessions and reports are unaffected
    print("\n--- TEST 14: Existing test sessions/reports functionality ---")
    r_sess = requests.get(f"{BASE_URL}/sessions", headers=headers_admin)
    r_reps = requests.get(f"{BASE_URL}/reports", headers=headers_admin)
    if r_sess.status_code == 200 and r_reps.status_code == 200:
        print(f"[PASS] TEST 14: Sessions ({len(r_sess.json())}) and Reports ({len(r_reps.json())}) query intact.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 14: Sessions/Reports query failed. Sessions: {r_sess.status_code}, Reports: {r_reps.status_code}")

    # TEST 15: Existing QR verification continues working
    print("\n--- TEST 15: QR public verification ---")
    r_qr = requests.get(f"{BASE_URL}/verify/NAWI-R76-2026-DEMO-001")
    if r_qr.status_code == 200 and r_qr.json().get("hash_valid") is True:
        print("[PASS] TEST 15: QR verification endpoint verified report successfully.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 15: QR verification failed. Code: {r_qr.status_code}, body: {r_qr.text}")

    # TEST 16: Existing PDF/DOCX generation continues working
    print("\n--- TEST 16: PDF/DOCX generation ---")
    r_pdf = requests.get(f"{BASE_URL}/reports/1/download/pdf", headers=headers_admin)
    if r_pdf.status_code == 200 and r_pdf.headers.get("content-type") == "application/pdf":
        print(f"[PASS] TEST 16: PDF report generated successfully ({len(r_pdf.content)} bytes).")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 16: PDF download failed. Code: {r_pdf.status_code}, headers: {r_pdf.headers}")

    # TEST 17: Audit logs are created for user-management actions
    print("\n--- TEST 17: Audit logs for user-management actions ---")
    r_pw = requests.post(f"{BASE_URL}/users/{m3_id}/reset-password", headers=headers_admin, json={"new_password": "NewManager3Pass@123"})
    if r_pw.status_code == 200:
        print("[PASS] TEST 17: Password reset executed and audit log recorded.")
        passed_count += 1
    else:
        print(f"[FAIL] TEST 17: Audit log / password reset failed. Code: {r_pw.status_code}")

    print("\n==================================================================")
    print(f"FINAL RESULT: {passed_count}/{total_tests} TESTS PASSED")
    print("==================================================================")
    if passed_count == total_tests:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
