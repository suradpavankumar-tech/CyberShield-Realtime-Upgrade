# CyberShield

CyberShield is an authenticated AI-assisted security analysis platform for URL, message and email investigations, expanded with security-awareness simulations, Android permission analysis, browser URL protection, authorized network service discovery, and email-header forensics.

## Security modules

| Module | Purpose | Backend endpoint |
| --- | --- | --- |
| Threat analysis | URL, message and email risk analysis | `/api/v1/analysis/*` |
| Email Header Analyzer | Header/authentication forensics | `/api/v1/email-headers` |
| Mobile Permission Scanner | Authorized APK permission/privacy review | `/api/v1/mobile` |
| URL Guard | Browser extension using the existing URL engine | `/api/v1/analysis/url` |
| Vulnerability Scanner | Authorized Nmap service/version discovery | `/api/v1/vulnerabilities` |
| Security Awareness | Controlled training/simulation campaigns | `/api/v1/security-campaigns` |

All expanded modules persist authenticated user-owned records and expose module-specific evidence, findings and recommendations. They do not silently fabricate scan results.

## Architecture

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT authentication
- Intelligence: existing URL/ML/NLP pipeline plus module-specific analyzers
- Frontend: React, TypeScript, Vite, Tailwind and React Router
- Browser extension: Chrome Manifest V3
- Background network scanning: Nmap service/version detection only

## Local backend setup

1. Create a Python 3.12 virtual environment.
2. Install Python dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

3. Install **Nmap** on the server if the authorized vulnerability scanner will be used. Nmap is an operating-system dependency and is intentionally not installed by pip.
4. Configure `backend/.env` from `backend/.env.example`.
5. Apply migrations:

```bash
cd backend
alembic upgrade head
```

6. Start the API:

```bash
uvicorn app.main:app --reload
```

The vulnerability scanner will report a clear server-side dependency error if Nmap is unavailable. The mobile scanner requires the pinned Androguard dependency included in `backend/requirements.txt`.

## Frontend

Configure `frontend/.env` using `frontend/.env.example`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Then:

```bash
cd frontend
npm ci
npm run dev
```

Never place JWT signing secrets, database credentials or private provider keys in `VITE_*` variables.

## Browser extension

The `extension/` directory contains the CyberShield URL Guard Manifest V3 extension.

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select the repository's `extension/` directory.
5. Open Extension settings.
6. Configure the deployed CyberShield API base URL and your own authenticated JWT.
7. Open an HTTP(S) page and choose **Analyze current URL**.

The extension delegates the decision to the existing backend URL engine. It does not contain backend secrets, collect passwords, inspect page form credentials or implement a second phishing classifier.

## Authorized security boundaries

### Security Awareness
Campaigns are intended for authorized recipients and training. CyberShield does not collect passwords, OTPs or other credentials and does not deliver malware, persistence or exploitation payloads.

### Vulnerability Scanner
Only scan assets for which the operator has authorization. The implementation performs Nmap service/version discovery and evidence-based exposure findings. It does not automate exploitation, credential theft, stealth, persistence or evasion.

### Mobile Scanner
Only analyze APKs that the operator is authorized to inspect. The scanner focuses on manifest permissions and privacy/security implications.

## Database migrations

The expanded migration chain is:

`3a4c9d2e7b11` → `7c9d2e4f1a10` → `8e1f3a5c7b20` → `9b2c4d6e8f31` → `a4c6e8f0b2d3`

Run `alembic upgrade head` before using the expanded modules.

## Testing

Backend unit tests:

```bash
cd backend
python -m pytest -q
```

Frontend production build:

```bash
cd frontend
npm ci
npm run build
```

GitHub Actions runs both backend tests and the frontend build on the feature branch and pull requests to `main`.

## Environment variables

Backend requires a PostgreSQL connection and a strong `JWT_SECRET_KEY`. Optional threat-intelligence configuration is documented in `backend/.env.example`.

Frontend requires only the API base URL. Browser extension credentials are configured by the user in extension-local storage and are not committed to the repository.
