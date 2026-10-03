# CyberShield — Real-Time URL Analysis Upgrade

This package preserves the existing CyberShield architecture and ML model. The upgrade changes URL assessment from ML-dominated scoring to evidence-based multi-signal analysis.

## Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Fill DATABASE_URL and JWT settings.
# Optional: VIRUSTOTAL_API_KEY for a real reputation lookup.

alembic upgrade head
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set the frontend API base URL in `.env` to the running backend.

## What is now real

- URL normalization and registered-domain parsing
- DNS resolution with SSRF/private-network blocking
- HTTPS/TLS verification when reachable
- bounded HTTP HEAD/redirect analysis
- redirect-chain and cross-domain detection
- optional VirusTotal lookup when an API key is configured
- brand impersonation / typosquatting signals
- existing ML model retained as a signal only
- evidence-based final risk score and confidence
- persisted `analysis_details` and `verdict`
- frontend display of live evidence and final assessment

## Honest unavailable states

If DNS, TLS, HTTP, or an external reputation provider cannot be checked, CyberShield records that as unavailable/incomplete. It does not fabricate a clean or malicious result.

## Security controls

The live analyzer blocks localhost/private/link-local/reserved/loopback targets, restricts protocols, limits redirects, uses request timeouts, and avoids downloading arbitrary response bodies.

## Important model note

The current trained model can still be poorly calibrated or dataset-biased. Its phishing probability is therefore shown separately and cannot by itself produce a malicious/critical verdict.
