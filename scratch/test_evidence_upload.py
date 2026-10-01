import sys
import os
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_test():
    print("==================================================================")
    print("OBJECTIVE 1 & 8: EVIDENCE UPLOAD & INTEGRITY SUITE")
    print("==================================================================")
    
    # 1. Login as Inspector
    print("\n--- 1. Authenticating as Inspector ---")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "inspector.delhi@nawi.gov.in", "password": "Inspector@123"})
    if login_resp.status_code != 200:
        print(f"[FAIL] Inspector login failed: {login_resp.status_code} - {login_resp.text}")
        sys.exit(1)
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Inspector authenticated successfully.")

    # 2. Get active sessions
    sessions_resp = requests.get(f"{BASE_URL}/sessions", headers=headers)
    if sessions_resp.status_code != 200 or len(sessions_resp.json()) == 0:
        print("[FAIL] Could not retrieve test sessions")
        sys.exit(1)
    
    active_session = None
    for s in sessions_resp.json():
        if s["status"] != "finalized":
            active_session = s
            break
    
    if not active_session:
        active_session = sessions_resp.json()[0]

    session_id = active_session["id"]
    print(f"[PASS] Target test session ID: {session_id} (Status: {active_session['status']})")

    # 3. Upload photograph evidence
    print("\n--- 2. Uploading Photograph Evidence ---")
    photo_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xFF\xD9" # Mock JPEG bytes
    files = {"file": ("test_weighing_photo.jpg", photo_content, "image/jpeg")}
    data = {"description": "Photograph of NAWI scale load receptor"}

    upload_resp = requests.post(f"{BASE_URL}/sessions/{session_id}/evidence", headers=headers, files=files, data=data)
    if upload_resp.status_code != 200:
        print(f"[FAIL] Photograph upload failed: {upload_resp.status_code} - {upload_resp.text}")
        sys.exit(1)
    
    ev_data = upload_resp.json()
    evidence_id = ev_data["id"]
    print(f"[PASS] Photograph evidence uploaded successfully (Evidence ID: {evidence_id}, Name: {ev_data['file_name']}).")

    # 4. Verify evidence persistence in session details
    print("\n--- 3. Verifying Evidence Persistence in Session Details ---")
    detail_resp = requests.get(f"{BASE_URL}/sessions/{session_id}", headers=headers)
    if detail_resp.status_code != 200:
        print(f"[FAIL] Failed to retrieve session detail: {detail_resp.status_code}")
        sys.exit(1)
    
    ev_files = detail_resp.json().get("evidence_files", [])
    found = any(e["id"] == evidence_id for e in ev_files)
    if not found:
        print(f"[FAIL] Uploaded evidence ID {evidence_id} not found in session evidence_files register: {ev_files}")
        sys.exit(1)
    print(f"[PASS] Evidence ID {evidence_id} confirmed in session detail register ({len(ev_files)} total files).")

    # 5. Download evidence file and verify content
    print("\n--- 4. Downloading Evidence File ---")
    dl_resp = requests.get(f"{BASE_URL}/sessions/{session_id}/evidence/{evidence_id}/download", headers=headers)
    if dl_resp.status_code != 200 or dl_resp.content != photo_content:
        print(f"[FAIL] Evidence download failed or content mismatch. Code: {dl_resp.status_code}")
        sys.exit(1)
    print(f"[PASS] Evidence file downloaded cleanly ({len(dl_resp.content)} bytes matched).")

    # 6. Test Cross-Laboratory Security Isolation on Evidence
    print("\n--- 5. Security Test: Cross-Laboratory Evidence Isolation ---")
    login_lab2 = requests.post(f"{BASE_URL}/auth/login", json={"email": "inspector.mumbai@nawi.gov.in", "password": "Inspector@123"})
    if login_lab2.status_code == 200:
        token2 = login_lab2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # User from Lab B attempting to download Lab A session evidence
        cross_dl = requests.get(f"{BASE_URL}/sessions/{session_id}/evidence/{evidence_id}/download", headers=headers2)
        if cross_dl.status_code in [403, 404]:
            print(f"[PASS] Cross-laboratory evidence access blocked cleanly (HTTP {cross_dl.status_code}).")
        else:
            print(f"[FAIL] Cross-lab evidence access leak! Code: {cross_dl.status_code}")
            sys.exit(1)

    # 7. Test invalid file extension rejection
    print("\n--- 6. Security Test: Invalid File Type Rejection ---")
    invalid_files = {"file": ("malicious_script.exe", b"MZ\x90\x00", "application/x-msdownload")}
    inv_resp = requests.post(f"{BASE_URL}/sessions/{session_id}/evidence", headers=headers, files=invalid_files)
    if inv_resp.status_code == 400:
        print(f"[PASS] Invalid executable file extension rejected cleanly (HTTP 400: {inv_resp.json()['detail']}).")
    else:
        print(f"[FAIL] Invalid file type accepted! Code: {inv_resp.status_code}")
        sys.exit(1)

    # 8. Clean up uploaded test evidence
    print("\n--- 7. Deleting Test Evidence Attachment ---")
    del_resp = requests.delete(f"{BASE_URL}/sessions/{session_id}/evidence/{evidence_id}", headers=headers)
    if del_resp.status_code != 200:
        print(f"[FAIL] Evidence deletion failed: {del_resp.status_code} - {del_resp.text}")
        sys.exit(1)
    print(f"[PASS] Test evidence attachment deleted cleanly.")

    print("\n==================================================================")
    print("ALL EVIDENCE UPLOAD & SECURITY VERIFICATIONS PASSED (100%)")
    print("==================================================================")

if __name__ == "__main__":
    run_test()
