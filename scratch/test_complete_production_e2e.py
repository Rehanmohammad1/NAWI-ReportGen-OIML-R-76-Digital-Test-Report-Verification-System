import requests
import sys
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def print_header(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def main():
    print_header("NAWI SIH26035 — COMPLETE END-TO-END PRODUCTION WORKFLOW VERIFICATION")

    unique_id = str(uuid.uuid4())[:8]
    test_email = f"test_e2e_{unique_id}@nawi.gov.in"
    test_pass_initial = "InitialPass123!"
    test_pass_new = "UpdatedPass456!"
    test_name = f"E2E Test Inspector {unique_id}"

    # -------------------------------------------------------------
    # STEP 1: Registration of New Authority Account
    # -------------------------------------------------------------
    print("\n[STEP 1] Submitting self-registration for new authority user...")
    reg_payload = {
        "name": test_name,
        "email": test_email,
        "password": test_pass_initial,
        "role": "inspector",
        "requested_role": "inspector",
        "lab_id": 1
    }
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"Response ({reg_res.status_code}):", reg_res.json())
    assert reg_res.status_code == 200, "Registration failed!"
    assert reg_res.json()["status"] == "pending", "Status is not pending!"
    print("[PASS] Registration submitted cleanly. Account created with status='pending'.")

    # -------------------------------------------------------------
    # STEP 2: Attempt Login as Pending User (Must be Blocked)
    # -------------------------------------------------------------
    print("\n[STEP 2] Attempting login with newly registered (pending) user...")
    login_pending_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_initial
    })
    print(f"Response ({login_pending_res.status_code}):", login_pending_res.json())
    assert login_pending_res.status_code == 401, "Pending login was NOT blocked!"
    assert "pending" in login_pending_res.json()["detail"].lower(), "Unexpected error message!"
    print("[PASS] Pending user login correctly blocked by backend authentication guard.")

    # -------------------------------------------------------------
    # STEP 3: Admin Log In & Fetch Pending Registration Queue
    # -------------------------------------------------------------
    print("\n[STEP 3] Logging in as Administrator...")
    admin_login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@nawi.gov.in",
        "password": "Admin@123"
    })
    assert admin_login_res.status_code == 200, "Admin login failed!"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Administrator logged in successfully.")

    print("\n[STEP 4] Querying GET /users/pending register...")
    pending_list_res = requests.get(f"{BASE_URL}/users/pending", headers=admin_headers)
    assert pending_list_res.status_code == 200, "Failed to get pending users!"
    pending_users = pending_list_res.json()
    user_record = next((u for u in pending_users if u["email"] == test_email), None)
    assert user_record is not None, "Registered user not found in pending queue!"
    user_id = user_record["id"]
    print(f"[PASS] Pending user located in queue: ID={user_id}, Name='{user_record['name']}'")

    # -------------------------------------------------------------
    # STEP 5: Administrator Approves Account
    # -------------------------------------------------------------
    print(f"\n[STEP 5] Administrator approving user ID {user_id}...")
    approve_res = requests.post(
        f"{BASE_URL}/users/{user_id}/approve",
        headers=admin_headers,
        json={"role": "inspector", "lab_id": 1}
    )
    print(f"Response ({approve_res.status_code}):", approve_res.json())
    assert approve_res.status_code == 200, "Approval failed!"
    approved_user_data = approve_res.json()
    assert approved_user_data["active"] is True, "User active boolean is not True!"
    assert approved_user_data["status"] == "active", "User status string is not 'active'!"
    print("[PASS] Database updated: status='active', active=True.")

    # -------------------------------------------------------------
    # STEP 6: Approved User Logs In
    # -------------------------------------------------------------
    print("\n[STEP 6] Attempting login as newly approved user...")
    login_approved_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_initial
    })
    print(f"Response ({login_approved_res.status_code}):", login_approved_res.json())
    assert login_approved_res.status_code == 200, "Approved user login failed!"
    user_token = login_approved_res.json()["access_token"]
    user_info = login_approved_res.json()["user"]
    assert user_info["role"] == "inspector", "Incorrect role assigned!"
    assert user_info["lab_id"] == 1, "Incorrect lab assigned!"
    print("[PASS] Login SUCCESSFUL! Assigned Role & Laboratory Scoping verified.")

    # -------------------------------------------------------------
    # STEP 7: Password Reset ("Pass" Action)
    # -------------------------------------------------------------
    print(f"\n[STEP 7] Administrator resetting passphrase for user ID {user_id}...")
    reset_res = requests.post(
        f"{BASE_URL}/users/{user_id}/reset-password",
        headers=admin_headers,
        json={"new_password": test_pass_new}
    )
    print(f"Response ({reset_res.status_code}):", reset_res.json())
    assert reset_res.status_code == 200, "Password reset failed!"
    print("[PASS] Passphrase updated in database.")

    print("\n[STEP 7b] Testing login with OLD password (Must Fail)...")
    old_pass_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_initial
    })
    assert old_pass_login.status_code == 401, "Old password was NOT rejected!"
    print("[PASS] Old password correctly rejected.")

    print("\n[STEP 7c] Testing login with NEW password (Must Succeed)...")
    new_pass_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_new
    })
    assert new_pass_login.status_code == 200, "New password login failed!"
    print("[PASS] Login with NEW passphrase SUCCESSFUL.")

    # -------------------------------------------------------------
    # STEP 8: Account Deactivation ("Disable" Action)
    # -------------------------------------------------------------
    print(f"\n[STEP 8] Administrator disabling user ID {user_id}...")
    disable_res = requests.patch(
        f"{BASE_URL}/users/{user_id}/status",
        headers=admin_headers,
        json={"active": False}
    )
    print(f"Response ({disable_res.status_code}):", disable_res.json())
    assert disable_res.status_code == 200, "Deactivation failed!"
    assert disable_res.json()["active"] is False, "Active flag is not False!"
    print("[PASS] Database record updated: active=False.")

    print("\n[STEP 8b] Attempting login with disabled account (Must Fail)...")
    disabled_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_new
    })
    print(f"Response ({disabled_login.status_code}):", disabled_login.json())
    assert disabled_login.status_code == 401, "Disabled account login was NOT blocked!"
    print("[PASS] Disabled account login correctly blocked.")

    # -------------------------------------------------------------
    # STEP 9: Account Reactivation ("Enable" Action)
    # -------------------------------------------------------------
    print(f"\n[STEP 9] Administrator reactivating user ID {user_id}...")
    enable_res = requests.patch(
        f"{BASE_URL}/users/{user_id}/status",
        headers=admin_headers,
        json={"active": True}
    )
    print(f"Response ({enable_res.status_code}):", enable_res.json())
    assert enable_res.status_code == 200, "Reactivation failed!"
    assert enable_res.json()["active"] is True, "Active flag is not True!"
    print("[PASS] Database record updated: active=True.")

    print("\n[STEP 9b] Attempting login with reactivated account (Must Succeed)...")
    reactivated_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_pass_new
    })
    assert reactivated_login.status_code == 200, "Reactivated account login failed!"
    print("[PASS] Login with reactivated account SUCCESSFUL.")

    # -------------------------------------------------------------
    # STEP 10: Report Downloads (PDF, DOCX, JSON, CSV) Verification
    # -------------------------------------------------------------
    print("\n[STEP 10] Testing Authenticated Report Downloads (PDF, DOCX, JSON, CSV)...")
    reports_res = requests.get(f"{BASE_URL}/reports", headers=admin_headers)
    assert reports_res.status_code == 200, "Reports search API failed!"
    reports = reports_res.json()
    assert len(reports) > 0, "No reports found in database!"
    target_rep = reports[0]
    rep_id = target_rep["id"]

    # 1. Unauthenticated download (Must return 401 Not authenticated)
    unauth_pdf = requests.get(f"{BASE_URL}/reports/{rep_id}/download/pdf")
    assert unauth_pdf.status_code == 401, "Unauthenticated PDF download was not blocked!"
    unauth_docx = requests.get(f"{BASE_URL}/reports/{rep_id}/download/docx")
    assert unauth_docx.status_code == 401, "Unauthenticated DOCX download was not blocked!"
    print("[PASS] Unauthenticated direct browser requests correctly return 401 Not authenticated.")

    # 2. Authenticated PDF download
    auth_pdf = requests.get(f"{BASE_URL}/reports/{rep_id}/download/pdf", headers=admin_headers)
    assert auth_pdf.status_code == 200, f"Authenticated PDF download failed with {auth_pdf.status_code}!"
    assert len(auth_pdf.content) > 0, "PDF content empty!"
    print(f"[PASS] Authenticated PDF download SUCCESSFUL ({len(auth_pdf.content)} bytes).")

    # 3. Authenticated DOCX download
    auth_docx = requests.get(f"{BASE_URL}/reports/{rep_id}/download/docx", headers=admin_headers)
    assert auth_docx.status_code == 200, f"Authenticated DOCX download failed with {auth_docx.status_code}!"
    assert len(auth_docx.content) > 0, "DOCX content empty!"
    print(f"[PASS] Authenticated DOCX download SUCCESSFUL ({len(auth_docx.content)} bytes).")

    # 4. Authenticated JSON export
    auth_json = requests.get(f"{BASE_URL}/reports/{rep_id}/export/json", headers=admin_headers)
    assert auth_json.status_code == 200, "Authenticated JSON export failed!"
    assert "report_number" in auth_json.json(), "JSON payload invalid!"
    print("[PASS] Authenticated JSON export SUCCESSFUL.")

    # 5. Authenticated CSV export
    auth_csv = requests.get(f"{BASE_URL}/reports/export/csv", headers=admin_headers)
    assert auth_csv.status_code == 200, "Authenticated CSV export failed!"
    assert len(auth_csv.content) > 0, "CSV content empty!"
    print("[PASS] Authenticated CSV export SUCCESSFUL.")

    print_header("FINAL RESULT: ALL 10 E2E WORKFLOW STAGES PASSED PERFECTLY!")

if __name__ == "__main__":
    main()
