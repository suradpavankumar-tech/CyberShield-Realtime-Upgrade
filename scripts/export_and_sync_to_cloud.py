import json
import psycopg2
import urllib.request
import urllib.error

LOCAL_PG_URL = "postgresql://postgres:Pss2006##@localhost:5432/cybershield"
CLOUD_API_URL = "https://cybershield-realtime-upgrade-production-daaf.up.railway.app/api/v1/system/sync-database"
SYNC_KEY = "cybershield_admin_sync_2026"

def serialize_val(v):
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v

def export_and_sync():
    print("[*] Connecting to local PostgreSQL database...")
    conn = psycopg2.connect(LOCAL_PG_URL)
    cur = conn.cursor()

    # 1. Fetch Users
    cur.execute("SELECT id, full_name, email, password_hash, role, is_active, is_verified, created_at, updated_at FROM users ORDER BY id;")
    user_rows = cur.fetchall()
    users = []
    for r in user_rows:
        users.append({
            "id": r[0],
            "full_name": r[1],
            "email": r[2],
            "password_hash": r[3],
            "role": r[4],
            "is_active": r[5],
            "is_verified": r[6],
            "created_at": serialize_val(r[7]),
            "updated_at": serialize_val(r[8]),
        })
    print(f"[+] Loaded {len(users)} users from local database.")

    # 2. Fetch Scans
    cur.execute("SELECT id, user_id, input_type, input_content, status, risk_score, risk_level, threat_category, confidence, created_at, completed_at, error_message, analysis_details, verdict FROM scans ORDER BY id;")
    scan_rows = cur.fetchall()
    scans = []
    for r in scan_rows:
        scans.append({
            "id": r[0],
            "user_id": r[1],
            "input_type": r[2],
            "input_content": r[3],
            "status": r[4],
            "risk_score": r[5],
            "risk_level": r[6],
            "threat_category": r[7],
            "confidence": r[8],
            "created_at": serialize_val(r[9]),
            "completed_at": serialize_val(r[10]),
            "error_message": r[11],
            "analysis_details": r[12] if isinstance(r[12], dict) else None,
            "verdict": r[13],
        })
    print(f"[+] Loaded {len(scans)} scans from local database.")

    # 3. Fetch Threat Indicators
    cur.execute("SELECT id, scan_id, indicator_type, name, description, severity, score, source FROM threat_indicators ORDER BY id;")
    indicator_rows = cur.fetchall()
    indicators = []
    for r in indicator_rows:
        indicators.append({
            "id": r[0],
            "scan_id": r[1],
            "indicator_type": r[2],
            "name": r[3],
            "description": r[4],
            "severity": r[5],
            "score": r[6],
            "source": r[7],
        })
    print(f"[+] Loaded {len(indicators)} threat indicators from local database.")

    # 4. Fetch Email Header Scans
    cur.execute("SELECT id, user_id, sender, recipient, subject, spf_status, dkim_status, dmarc_status, risk_score, risk_level, header_content, findings FROM email_header_scans ORDER BY id;")
    eh_rows = cur.fetchall()
    eh_scans = []
    for r in eh_rows:
        eh_scans.append({
            "id": r[0],
            "user_id": r[1],
            "sender": r[2],
            "recipient": r[3],
            "subject": r[4],
            "spf_status": r[5],
            "dkim_status": r[6],
            "dmarc_status": r[7],
            "risk_score": r[8],
            "risk_level": r[9],
            "header_content": r[10],
            "findings": r[11] if isinstance(r[11], dict) else None,
        })
    print(f"[+] Loaded {len(eh_scans)} email header scans.")

    # 5. Fetch Vulnerability Scans
    cur.execute("SELECT id, user_id, target, port_spec, status, risk_score, risk_level, findings, services, evidence, recommendations FROM vulnerability_scans ORDER BY id;")
    v_rows = cur.fetchall()
    v_scans = []
    for r in v_rows:
        v_scans.append({
            "id": r[0],
            "user_id": r[1],
            "target": r[2],
            "port_spec": r[3],
            "status": r[4],
            "risk_score": r[5],
            "risk_level": r[6],
            "findings": r[7] if isinstance(r[7], list) else None,
            "services": r[8] if isinstance(r[8], list) else None,
            "evidence": r[9] if isinstance(r[9], dict) else None,
            "recommendations": r[10] if isinstance(r[10], list) else None,
        })
    print(f"[+] Loaded {len(v_scans)} vulnerability scans.")

    # 6. Fetch Security Campaigns
    cur.execute("SELECT id, user_id, name, campaign_type, difficulty, status, template_id, subject, sender_profile, total_recipients, metrics FROM security_campaigns ORDER BY id;")
    c_rows = cur.fetchall()
    c_scans = []
    for r in c_rows:
        c_scans.append({
            "id": r[0],
            "user_id": r[1],
            "name": r[2],
            "campaign_type": r[3],
            "difficulty": r[4],
            "status": r[5],
            "template_id": r[6],
            "subject": r[7],
            "sender_profile": r[8],
            "total_recipients": r[9],
            "metrics": r[10] if isinstance(r[10], dict) else None,
        })
    print(f"[+] Loaded {len(c_scans)} security campaigns.")

    conn.close()

    payload = {
        "sync_key": SYNC_KEY,
        "users": users,
        "scans": scans,
        "threat_indicators": indicators,
        "email_header_scans": eh_scans,
        "vulnerability_scans": v_scans,
        "security_campaigns": c_scans,
    }

    print(f"[*] Sending payload to Cloud API ({CLOUD_API_URL})...")
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        CLOUD_API_URL,
        data=data_bytes,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print("[SUCCESS] Cloud sync response:", result)
            return True
    except urllib.error.HTTPError as e:
        print(f"[ERROR] HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"[ERROR] Sync error: {e}")
        return False

if __name__ == "__main__":
    export_and_sync()
